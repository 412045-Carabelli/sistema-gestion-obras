package com.backups.controller;

import com.backups.dto.*;
import com.backups.service.BackupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/backups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BackupController {

    private final BackupService backupService;

    @GetMapping("/summary")
    public ResponseEntity<BackupSummaryResponse> summary() {
        return ResponseEntity.ok(backupService.getSummary());
    }

    @GetMapping
    public ResponseEntity<List<BackupJobResponse>> list() {
        return ResponseEntity.ok(backupService.listBackups());
    }

    @PostMapping("/manual")
    public ResponseEntity<BackupJobResponse> createManual(@Valid @RequestBody BackupCreateRequest request) {
        return ResponseEntity.ok(backupService.createManualBackup(request));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BackupJobResponse> importBackup(
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "requestedBy", required = false) String requestedBy,
            @RequestPart(value = "comment", required = false) String comment
    ) {
        return ResponseEntity.ok(backupService.importBackup(file, requestedBy, comment));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable("id") Long id) {
        Resource resource = backupService.getArtifact(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<BackupRestoreResponse> restore(@PathVariable("id") Long id) {
        return ResponseEntity.ok(backupService.restoreBackup(id));
    }

    @GetMapping("/schedule")
    public ResponseEntity<BackupScheduleResponse> getSchedule() {
        return ResponseEntity.ok(backupService.getSchedule());
    }

    @PutMapping("/schedule")
    public ResponseEntity<BackupScheduleResponse> updateSchedule(@Valid @RequestBody BackupScheduleRequest request) {
        return ResponseEntity.ok(backupService.updateSchedule(request));
    }
}
