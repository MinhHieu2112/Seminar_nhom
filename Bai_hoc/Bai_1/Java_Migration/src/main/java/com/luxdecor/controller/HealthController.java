package com.luxdecor.controller;

import com.luxdecor.model.HealthCheckDetail;
import com.luxdecor.model.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@RestController
public class HealthController {
    private final Instant start = Instant.now();

    @GetMapping("/health")
    public HealthResponse health() {
        Instant now = Instant.now();
        double uptime = Duration.between(start, now).toMillis() / 1000.0;
        List<HealthCheckDetail> checks = List.of(new HealthCheckDetail("application", "ok", "running"));
        String overall = checks.stream().allMatch(c -> "ok".equalsIgnoreCase(c.getStatus())) ? "ok" : "degraded";
        return new HealthResponse(overall, uptime, now, checks);
    }
}
