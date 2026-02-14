package com.luxdecor.model;

import java.time.Instant;
import java.util.List;

public class HealthResponse {
    private String status;
    private double uptimeSeconds;
    private Instant timestamp;
    private List<HealthCheckDetail> checks;

    public HealthResponse() {}

    public HealthResponse(String status, double uptimeSeconds, Instant timestamp, List<HealthCheckDetail> checks) {
        this.status = status;
        this.uptimeSeconds = uptimeSeconds;
        this.timestamp = timestamp;
        this.checks = checks;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(double uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public List<HealthCheckDetail> getChecks() { return checks; }
    public void setChecks(List<HealthCheckDetail> checks) { this.checks = checks; }
}
