package com.crime.analytics.api.v1.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller for forwarding Single Page Application (SPA) routes to index.html
 */
@Controller
public class SpaController {

    @GetMapping(value = {"/", "/login", "/case-entry", "/report", "/dashboard"})
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}
