
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: "sessions",
    });

    const isProd = process.env.NODE_ENV === 'production';

    return session({
        secret: process.env.SESSION_SECRET || 'change-me-in-production',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProd || process.env.FORCE_SECURE_COOKIE === 'true',
            sameSite: isProd || process.env.FORCE_SECURE_COOKIE === 'true' ? 'none' : 'lax',
            maxAge: sessionTtl,
        },
    });
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser && sessionUser.id) {
        // Refresh user data from DB to ensure they are still active and have correct role
        try {
            const dbUser = await storage.getUser(sessionUser.id);
            if (dbUser && dbUser.isActive) {
                (req as any).user = dbUser;
                return next();
            } else {
                // User not found or inactive, destroy session
                req.session.destroy(() => { });
                return res.status(401).json({ message: "Unauthorized" });
            }
        } catch (error) {
            console.error("Auth middleware error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    res.status(401).json({ message: "Unauthorized" });
};
