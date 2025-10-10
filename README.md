# Lab7-ARSW
## Emily Noreña y Haider Rodriguez


## Procesos de desarrollo de software - PDSW - Construción de un cliente 'grueso' con un API REST, HTML5, Javascript y CSS3. Parte II.

1. Agregue al canvas de la página un manejador de eventos que permita capturar los 'clicks' realizados, bien sea a través del mouse, o a través de una pantalla táctil. Para esto, tenga en cuenta este ejemplo de uso de los eventos de tipo 'PointerEvent'.

```
if (window.PointerEvent) {
      canvas.addEventListener("pointerdown", function(event) {
        alert('pointerdown at ' + event.pageX + ',' + event.pageY);
      });
    } else {
      canvas.addEventListener("mousedown", function(event) {
        alert('mousedown at ' + event.clientX + ',' + event.clientY);
      });
}
```

2. Agregue lo que haga falta en sus módulos para que cuando se capturen nuevos puntos en el canvas abierto (si no se ha seleccionado un canvas NO se debe hacer nada):
- Se agregue el punto al final de la secuencia de puntos del canvas actual (sólo en la memoria de la aplicación, AÚN NO EN EL API!).

<img src="img/punto2.1.png">

- Se repinte el dibujo.

<img src="img/punto2.1.png">
