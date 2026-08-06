# Monitoring

Prometheus + Grafana stack for the platform.

- `prometheus.yml` – scrape config (API metrics endpoint, postgres, redis)
- `alerts.yml` – alerting rules (API downtime, elevated 5xx, DB connections)
- `grafana/` – provisioned datasource; add dashboards in the Grafana UI

## Running locally

```bash
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/infrastructure/monitoring:/etc/prometheus prom/prometheus

docker run -d --name grafana -p 3000:3000 \
  -v $(pwd)/infrastructure/monitoring/grafana/provisioning:/etc/grafana/provisioning grafana/grafana
```

## Adding metrics to the API

The NestJS API is wired for `prom-client` (add the dependency + a `/metrics`
controller) or use the OpenTelemetry SDK and scrape the OTLP endpoint. The
scrape job assumes a `/metrics` endpoint on port 4000.
