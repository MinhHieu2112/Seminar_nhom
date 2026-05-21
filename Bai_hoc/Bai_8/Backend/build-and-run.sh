#!/bin/bash
# ============================================================
# build-and-run.sh
# Script build tất cả service Spring Boot rồi chạy docker-compose
# Tương thích: macOS (Apple Silicon & Intel)
# ============================================================

set -e  # Dừng ngay nếu có lỗi

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICES=("eureka-server" "api-gateway" "user-service" "product-service" "order-service" "notification-service" "payment-service")

echo "========================================"
echo "  Build & Run ProjectWeb-BE"
echo "  Base dir: $BASE_DIR"
echo "========================================"

# ── Tìm Java 17 hoặc 21 (tương thích với Lombok + Spring Boot 3) ───────────
find_java_home() {
  local candidates=(
    "/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  )
  for dir in "${candidates[@]}"; do
    if [ -d "$dir" ]; then
      echo "$dir"
      return 0
    fi
  done
  # Fallback: dùng java_home tìm version 17 hoặc 21
  /usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 21 2>/dev/null || echo ""
}

JAVA_HOME_PATH=$(find_java_home)
if [ -z "$JAVA_HOME_PATH" ]; then
  echo "❌ Không tìm thấy Java 17 hoặc 21."
  echo "   Homebrew Maven đang dùng Java 25 (không tương thích với Lombok)."
  echo "   Cài Java 17: brew install --cask zulu17"
  exit 1
fi

export JAVA_HOME="$JAVA_HOME_PATH"
echo "✅ Sử dụng Java: $JAVA_HOME"
echo "   Java version: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"
echo ""

# ── Kiểm tra Maven ─────────────────────────────────────────────────────────
if ! command -v mvn &>/dev/null; then
  echo "❌ Maven chưa được cài. Cài bằng: brew install maven"
  exit 1
fi

echo "► Maven version: $(mvn --version | head -1)"
echo ""

# ── Build từng service ─────────────────────────────────────────────────────
FAILED=()
for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="$BASE_DIR/$SERVICE"
  if [ ! -f "$SERVICE_DIR/pom.xml" ]; then
    echo "⚠️  Bỏ qua $SERVICE (không tìm thấy pom.xml)"
    continue
  fi

  echo "──────────────────────────────────────"
  echo "► Building: $SERVICE ..."
  echo "──────────────────────────────────────"

  if mvn -f "$SERVICE_DIR/pom.xml" package -Dmaven.test.skip=true -q; then
    echo "✅ $SERVICE build thành công"
  else
    echo "❌ $SERVICE build THẤT BẠI"
    FAILED+=("$SERVICE")
  fi
  echo ""
done

# ── Báo cáo kết quả build ──────────────────────────────────────────────────
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "========================================"
  echo "❌ Các service build thất bại:"
  for s in "${FAILED[@]}"; do echo "   - $s"; done
  echo "========================================"
  echo ""
fi

# ── Chạy docker-compose ────────────────────────────────────────────────────
echo "========================================"
echo "► Khởi động docker-compose..."
echo "========================================"
cd "$BASE_DIR"
docker-compose up -d --build

echo ""
echo "========================================"
echo "✅ Xong! Các service đang chạy:"
docker-compose ps
echo ""
echo "Các cổng quan trọng:"
echo "  Eureka Dashboard : http://localhost:8761"
echo "  API Gateway      : http://localhost:8181"
echo "  Kafka UI         : http://localhost:8080"
echo "  Zipkin           : http://localhost:9411"
echo "  Prometheus       : http://localhost:9090"
echo "========================================"
