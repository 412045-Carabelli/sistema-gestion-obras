package com.documentos.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import io.minio.errors.MinioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "minio.enabled", havingValue = "true")
public class MinioConfig {

    @Bean
    public MinioClient minioClient(
            @Value("${minio.url}") String url,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey
    ) {
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Bean
    public CommandLineRunner minioBucketInitializer(
            MinioClient minioClient,
            @Value("${minio.bucket}") String bucket,
            @Value("${minio.logos-bucket:logos}") String logosBucket
    ) {
        return args -> {
            try {
                // Bucket documentos (privado)
                boolean exists = minioClient.bucketExists(
                        BucketExistsArgs.builder().bucket(bucket).build()
                );
                if (!exists) {
                    minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                }

                // Bucket logos (lectura pública)
                boolean logosExists = minioClient.bucketExists(
                        BucketExistsArgs.builder().bucket(logosBucket).build()
                );
                if (!logosExists) {
                    minioClient.makeBucket(MakeBucketArgs.builder().bucket(logosBucket).build());
                }
                // Política de lectura pública para el bucket logos
                String publicPolicy = """
                        {
                          "Version": "2012-10-17",
                          "Statement": [
                            {
                              "Effect": "Allow",
                              "Principal": {"AWS": ["*"]},
                              "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                              "Resource": ["arn:aws:s3:::%s"]
                            },
                            {
                              "Effect": "Allow",
                              "Principal": {"AWS": ["*"]},
                              "Action": ["s3:GetObject"],
                              "Resource": ["arn:aws:s3:::%s/*"]
                            }
                          ]
                        }""".formatted(logosBucket, logosBucket);
                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(logosBucket)
                                .config(publicPolicy)
                                .build()
                );
            } catch (MinioException ex) {
                throw new RuntimeException("No se pudo inicializar el bucket MinIO.", ex);
            }
        };
    }
}
