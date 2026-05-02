package com.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        System.out.println("🚀 SGO - API Gateway v1.14.29");
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
