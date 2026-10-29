import logging
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import (
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_URL,
    SQLITE_URL
)

logger = logging.getLogger("meiyalagu.database")
Base = declarative_base()


def init_mysql_database():
    """Ensure the MySQL database exists before SQLAlchemy connects."""
    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset="utf8mb4"
        )
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.warning(
            f"Could not initialize MySQL database '{MYSQL_DATABASE}': {e}. "
            "Please check MYSQL_PASSWORD in backend/.env."
        )
        return False


def create_db_engine():
    """Create SQLAlchemy engine: attempts MySQL first, falls back to SQLite if credentials needed."""
    mysql_ready = init_mysql_database()
    if mysql_ready:
        try:
            engine = create_engine(
                MYSQL_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False
            )
            # Test connection
            with engine.connect() as conn:
                pass
            print(f"[MySQL] Connected to MySQL Database '{MYSQL_DATABASE}' at {MYSQL_HOST}:{MYSQL_PORT} (Visible in MySQL Workbench)")
            return engine, "mysql"
        except Exception as e:
            print(f"[MySQL Warning] Connection error: {e}. Falling back to SQLite.")

    # SQLite fallback until user supplies valid MySQL password in .env
    print("[Database Notice] Using local database until MySQL credentials are set in backend/.env.")
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )
    return engine, "sqlite"


engine, DB_DIALECT = create_db_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
