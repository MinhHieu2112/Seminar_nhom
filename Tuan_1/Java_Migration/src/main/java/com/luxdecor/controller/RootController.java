package com.luxdecor.controller;

import com.luxdecor.model.RootResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public RootResponse root() {
        return new RootResponse("LuxDecor API", "0.1.0", "Welcome to LuxDecor API");
    }
}
