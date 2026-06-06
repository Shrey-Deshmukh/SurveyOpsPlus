from fastapi import Request, Response, status
from src.db import PostgresConnectionPool


async def handle_service_health(request: Request, response: Response) -> dict:
    client_ip = "Unknown"
    if request.client:
        client_ip = request.client.host

    db_status = "Unhealthy"
    try:
        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO service_health (service_name, status, last_checked_at, client_ip)
                    VALUES ('readiness_check', 'Healthy', NOW(), %s)
                    ON CONFLICT (service_name)
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        last_checked_at = EXCLUDED.last_checked_at,
                        client_ip = EXCLUDED.client_ip;
                """, (client_ip,))
            conn.commit()
        db_status = "Healthy"
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"service": "Health v1", "client_ip": client_ip, "status": "Unhealthy", "db_status": db_status}

    response.status_code = status.HTTP_200_OK
    return {"service": "Health v1", "client_ip": client_ip, "status": "Healthy", "db_status": db_status}