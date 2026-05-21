package com.luxdecor.model;

public class RootResponse {
    private String app;
    private String version;
    private String message;

    public RootResponse() {}

    public RootResponse(String app, String version, String message) {
        this.app = app;
        this.version = version;
        this.message = message;
    }

    public String getApp() { return app; }
    public void setApp(String app) { this.app = app; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
