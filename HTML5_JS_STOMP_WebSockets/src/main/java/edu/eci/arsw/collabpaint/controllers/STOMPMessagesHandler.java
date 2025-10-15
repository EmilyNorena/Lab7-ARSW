package edu.eci.arsw.collabpaint.controllers;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    private SimpMessagingTemplate msgt;

    private final Map<String, List<Point>> drawings = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor: " + pt + " para dibujo " + numdibujo);

        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        drawings.putIfAbsent(numdibujo, Collections.synchronizedList(new ArrayList<>()));
        List<Point> points = drawings.get(numdibujo);

        synchronized (points) {
            points.add(pt);

            if (points.size() >= 3) {
                Polygon polygon = new Polygon(new ArrayList<>(points));
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
                System.out.println("Polígono enviado al tópico /topic/newpolygon." + numdibujo);
            }
        }
    }

    public static class Point {
        private int x;
        private int y;

        public Point() {}
        public Point(int x, int y) { this.x = x; this.y = y; }

        public int getX() { return x; }
        public int getY() { return y; }

        public void setX(int x) { this.x = x; }
        public void setY(int y) { this.y = y; }

        @Override
        public String toString() {
            return "(" + x + ", " + y + ")";
        }
    }

    public static class Polygon {
        private List<Point> points;

        public Polygon() {}
        public Polygon(List<Point> points) { this.points = points; }

        public List<Point> getPoints() { return points; }
        public void setPoints(List<Point> points) { this.points = points; }
    }
}
