"""Background job scheduler for integration sync operations."""
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def init_scheduler():
    """Initialize and start the background scheduler."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Integration scheduler started")


def schedule_integration_sync(config_id: str, tenant_id: str, cron_expression: Optional[str] = None):
    """Schedule periodic integration sync job."""
    job_id = f"sync_{config_id}"
    
    try:
        if cron_expression:
            trigger = CronTrigger.from_crontab(cron_expression)
        else:
            trigger = CronTrigger.from_crontab("0 * * * *")  # Every hour

        scheduler.add_job(
            sync_job,
            trigger=trigger,
            args=(config_id, tenant_id),
            id=job_id,
            name=f"Sync integration {config_id}",
            replace_existing=True,
        )
        logger.info(f"Scheduled sync job for {config_id}")
    except Exception as e:
        logger.error(f"Failed to schedule sync job: {str(e)}")


def sync_job(config_id: str, tenant_id: str):
    """Background job for integration sync."""
    logger.info(f"Starting sync job for config {config_id} in tenant {tenant_id}")
    # This will be called by background scheduler
    # Integration service will handle actual sync logic


def process_webhook_events(tenant_id: str):
    """Background job to process pending webhook events."""
    logger.info(f"Processing webhook events for tenant {tenant_id}")


def remove_sync_job(config_id: str):
    """Remove scheduled sync job."""
    job_id = f"sync_{config_id}"
    try:
        scheduler.remove_job(job_id)
        logger.info(f"Removed sync job {job_id}")
    except Exception as e:
        logger.error(f"Failed to remove sync job: {str(e)}")


def shutdown_scheduler():
    """Shutdown the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Integration scheduler stopped")
