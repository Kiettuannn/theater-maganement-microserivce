package com.theater_mgnt.microserivce.notification.service;

import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SocketIOService {

    SocketIOServer socketIOServer;

    @PostConstruct
    public void startServer() {
        socketIOServer.start();
        log.info("Socket.IO server started on port {}", socketIOServer.getConfiguration().getPort());
        
        socketIOServer.addConnectListener(client -> {
            String accountId = client.getHandshakeData().getSingleUrlParam("accountId");
            if (accountId != null && !accountId.isEmpty()) {
                client.joinRoom("user:" + accountId);
                log.info("Client {} connected and joined room user:{}", client.getSessionId(), accountId);
            } else {
                log.warn("Client {} connected without accountId", client.getSessionId());
            }
        });

        socketIOServer.addDisconnectListener(client -> {
            log.info("Client {} disconnected", client.getSessionId());
        });
    }

    @PreDestroy
    public void stopServer() {
        socketIOServer.stop();
        log.info("Socket.IO server stopped");
    }

    public void emitNotificationToUser(String userId, Object dto) {
        String room = "user:" + userId;
        socketIOServer.getRoomOperations(room).sendEvent("notification:new", dto);
        log.info("Emitted notification:new to room {}", room);
    }
    
    public void emitNotificationToRoom(String room, Object dto) {
        socketIOServer.getRoomOperations(room).sendEvent("notification:new", dto);
        log.info("Emitted notification:new to room {}", room);
    }
}
