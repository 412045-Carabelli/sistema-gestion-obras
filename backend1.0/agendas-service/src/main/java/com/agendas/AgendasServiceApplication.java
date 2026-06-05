package com.agendas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgendasServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgendasServiceApplication.class, args);
    }
}
