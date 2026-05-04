# Eclipse Temurin (OpenJDK) 21 - thay thế openjdk:21-jdk-slim đã bị deprecated
FROM eclipse-temurin:21-jre-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file jar vào container
COPY target/payment-service-0.0.1-SNAPSHOT.jar /app/payment-service.jar

# Cấu hình cổng mà ứng dụng sẽ lắng nghe
EXPOSE 8085

# Chạy ứng dụng khi container bắt đầu
ENTRYPOINT ["java", "-jar", "/app/payment-service.jar"]