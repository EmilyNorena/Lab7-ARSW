package edu.eci.arsw.collabpaint.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    private ConcurrentHashMap<String, List<Point>> drawings = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt);

        // Obtener lista de puntos o crear una nueva si no existe
        drawings.putIfAbsent(numdibujo, new CopyOnWriteArrayList<>());
        List<Point> points = drawings.get(numdibujo);

        points.add(pt);
        msgt.convertAndSend("/topic/newpoint."+numdibujo, pt);

        // Si hay 3 o más puntos, formar y enviar el polígono
        if (points.size() >= 3) {
            Polygon polygon = new Polygon(new ArrayList<>(points));
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);

            points.clear();
        }
    }
}