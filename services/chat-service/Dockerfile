FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/chat-service .

FROM alpine:3.20
RUN adduser -D app
USER app
COPY --from=build /bin/chat-service /bin/chat-service
EXPOSE 8081
CMD ["/bin/chat-service"]
