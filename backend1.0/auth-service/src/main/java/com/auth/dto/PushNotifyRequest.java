package com.auth.dto;

import lombok.Data;

@Data
public class PushNotifyRequest {
    private Long organizacionId;
    private Long fromUserId;
    private String fromUsername;
    private String entity;
    private String entityName;
}
