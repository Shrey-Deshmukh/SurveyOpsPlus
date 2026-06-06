import pytest
import requests
import psycopg2


@pytest.mark.integration
class TestPostgresConnectionIntegration:
    def test_health_endpoint_reports_db_healthy(self, docker_env):
        """
        Health endpoint must report a healthy DB connection.
        """
        response = requests.get(f"{docker_env['server_url']}/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["db_status"] == "Healthy"

    def test_health_check_writes_to_db(self, docker_env):
        """
        After hitting the health endpoint, assert the row was actually
        written to the service_health table in postgres.
        """
        requests.get(f"{docker_env['server_url']}/api/v1/health")

        conn = psycopg2.connect(
            host=docker_env["db_host"],
            port=docker_env["db_port"],
            dbname=docker_env["db_name"],
            user=docker_env["db_user"],
            password=docker_env["db_password"],
        )

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT service_name, status
                    FROM service_health
                    WHERE service_name = 'readiness_check';
                """)
                row = cur.fetchone()

            assert row is not None, "No row found in service_health table"
            assert row[0] == "readiness_check"
            assert row[1] == "Healthy"
        finally:
            conn.close()