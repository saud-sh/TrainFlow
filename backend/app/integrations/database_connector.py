"""Database connector for pulling/pushing data to external databases."""
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.app.integrations.base_connector import BaseConnector


class DatabaseConnector(BaseConnector):
    """Connector for external database integrations."""

    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(config, credentials)
        self.db_type = config.get("db_type", "postgresql")  # postgresql, mysql, mssql, oracle
        self.engine = None

    def _build_connection_string(self) -> str:
        """Build database connection string."""
        host = self.credentials.get("host", "localhost")
        port = self.credentials.get("port", 5432)
        database = self.credentials.get("database", "")
        username = self.credentials.get("username", "")
        password = self.credentials.get("password", "")

        if self.db_type == "postgresql":
            return f"postgresql://{username}:{password}@{host}:{port}/{database}"
        elif self.db_type == "mysql":
            return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif self.db_type == "mssql":
            return f"mssql+pyodbc://{username}:{password}@{host}:{port}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")

    def test_connection(self) -> bool:
        """Test database connectivity."""
        try:
            conn_string = self._build_connection_string()
            engine = create_engine(conn_string)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    def pull(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Pull data from database using query."""
        try:
            if not query:
                query = self.config.get("pull_query", "SELECT * FROM users LIMIT 100")
            
            conn_string = self._build_connection_string()
            engine = create_engine(conn_string)
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()
                return [dict(row._mapping) for row in rows]
        except Exception as e:
            raise Exception(f"Database pull failed: {str(e)}")

    def push(self, data: List[Dict[str, Any]]) -> bool:
        """Push data to database table."""
        try:
            table = self.config.get("push_table", "imports")
            conn_string = self._build_connection_string()
            engine = create_engine(conn_string)

            with engine.begin() as conn:
                for record in data:
                    columns = ", ".join(record.keys())
                    values = ", ".join([f":{k}" for k in record.keys()])
                    query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
                    conn.execute(text(query), record)

            return True
        except Exception as e:
            raise Exception(f"Database push failed: {str(e)}")
