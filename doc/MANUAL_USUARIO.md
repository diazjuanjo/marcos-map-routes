# Manual de Usuario — RutaApp

Aplicación web para planificación y seguimiento de rutas de venta. Permite gestionar vendedores, asignar clientes a días de la semana, visualizar recorridos en un mapa interactivo e imprimir reportes.

---

## 1. Acceso a la aplicación

Al abrir la aplicación se muestra una pantalla de ingreso con un campo de contraseña. Ingresá la clave que te haya proporcionado el administrador y presioná **Ingresar**.

La sesión se mantiene activa durante la navegación. Si cerrás completamente el navegador, vas a tener que ingresar la contraseña de nuevo.

---

## 2. Pantalla principal

La interfaz se divide en dos áreas principales:

- **Panel lateral (izquierda)**: contiene la agenda del día, el catálogo de clientes, y los controles de usuario/día.
- **Mapa (derecha)**: muestra las paradas de la ruta sobre OpenStreetMap.

En dispositivos móviles podés alternar entre mapa y agenda usando los botones fijos en la parte inferior de la pantalla.

---

## 3. Selección de usuario y día

### 3.1 Usuario activo

En el encabezado del panel lateral hay un selector de usuario. Al hacer clic se despliega la lista de todos los usuarios. Cada usuario tiene una etiqueta que indica su rol:

- **Vendedor** (azul): puede administrar clientes, asignar rutas y modificar datos.
- **Fletero** (ámbar): ve las rutas combinadas de los vendedores en sus días de recorrido.

### 3.2 Día seleccionado

Debajo del selector de usuario está el selector de día. Al cambiar de usuario el día se ajusta automáticamente:

- **Vendedores**: lunes a domingo.
- **Fleteros**: martes a sábado (sus días de recorrido). Cada día del fletero muestra lo que los vendedores asignaron el día anterior (ej: martes → lunes).

---

## 4. Gestión de usuarios

Desde el selector de usuario podés:

- **Agregar usuario**: al final del listado hay un formulario para escribir un nombre y elegir rol (Vendedor o Fletero). Presioná el botón `+` o Enter para crearlo.
- **Editar usuario**: hacé clic en el ícono de lápiz al lado del nombre. Podés cambiar el nombre y el rol. Guardá con el check verde o cancelá con la X roja.
- **Eliminar usuario**: hacé clic en el ícono de papelera. Confirmá la eliminación. Se borrarán también todas las asignaciones de ruta de ese usuario.

---

## 5. Catálogo de clientes

El panel lateral tiene dos pestañas: **Ruta** y **Catálogo**.

En la pestaña **Catálogo** se listan todos los clientes registrados. Cada cliente muestra:

- Número de orden en el catálogo
- Nombre
- Horario pactado (si tiene)
- Dirección (si tiene)
- Notas (si tiene, en texto ámbar)

### 5.1 Agregar un cliente

Hay dos formas:

1. **Desde el catálogo**: presioná el botón **Agregar Cliente** (borde punteado) al inicio del listado.
2. **Desde el mapa**: hacé clic en cualquier lugar del mapa. Se abre el formulario con las coordenadas ya completadas.

El formulario tiene estos campos:

| Campo | Requerido | Descripción |
|---|---|---|
| Nombre del cliente | Sí | Ej: "Supermercado López" |
| Dirección | No | Ej: "Av. Mitre 450" |
| Teléfono | No | Ej: "381 555-0123" |
| Horario pactado | No | Selector de hora |
| Notas | No | Instrucciones, referencias, etc. |

Presioná **Agregar al catálogo** para guardar.

### 5.2 Editar un cliente

Hacé clic en el ícono de lápiz al lado del cliente en el catálogo. Modificá los campos y presioná **Guardar cambios**.

### 5.3 Eliminar un cliente

Hacé clic en el ícono de papelera. Confirmá la eliminación. Se eliminará también de todas las rutas donde esté asignado.

### 5.4 Reordenar el catálogo

Usá el ícono de agarre (seis puntos) a la izquierda de cada cliente para arrastrarlo a la posición que quieras.

---

## 6. Asignación de rutas (vendedores)

### 6.1 Asignar desde el catálogo

En la pestaña **Catálogo**, cada cliente tiene un botón a la derecha:

- `+` **Agregar**: lo agrega a la ruta del día seleccionado.
- Check verde **En ruta**: ya está asignado. Hacé clic para sacarlo de la ruta.

### 6.2 Asignar desde la pestaña Ruta

La pestaña **Ruta** tiene dos secciones:

- **Ruta del día**: los clientes ya asignados, en el orden de recorrido.
- **Disponibles**: clientes del catálogo que aún no están en esta ruta. Hacé clic en cualquiera para asignarlo.

### 6.3 Reordenar la ruta

Arrastrá los clientes por el ícono de agarre (seis puntos) para cambiar el orden de visita. El orden se refleja automáticamente en el mapa.

### 6.4 Estados de visita

Cada cliente en la ruta tiene un color en el borde izquierdo:

- **Ámbar** = Pendiente
- **Verde** = Completado
- **Rojo** = Cancelado

Para cambiar el estado:

- **Desde la lista**: si está pendiente, aparece un botón de check verde. Si está completado, aparece un botón para revertir a pendiente.
- **Desde el mapa**: hacé clic en el marcador del cliente. Se abre un popup con tres botones: **Listo** (completado), **Pendiente**, **Cancelar**.

---

## 7. Mapa interactivo

### 7.1 Marcadores numerados

Cada cliente asignado aparece como un marcador circular numerado en el mapa. El color del círculo indica el estado:

- **Azul** = Pendiente
- **Verde** = Completado
- **Rojo** = Cancelado

Los números siguen el orden de la ruta.

### 7.2 Línea de ruta

Una línea punteada azul conecta todos los marcadores en orden, mostrando el recorrido planificado.

### 7.3 Agregar clientes desde el mapa

Hacé clic en cualquier lugar vacío del mapa. Aparece un marcador temporal naranja y se abre el formulario para agregar el cliente.

### 7.4 Mover marcadores (solo vendedores)

Arrastrá cualquier marcador a una nueva ubicación. Las coordenadas se actualizan automáticamente.

### 7.5 Popup de información

Hacé clic en un marcador para ver:

- Número y nombre del cliente
- Horario pactado
- Dirección
- Notas
- Botones para cambiar el estado

### 7.6 Controles de zoom

Usá los botones `+` y `-` en la esquina superior derecha del mapa para acercar o alejar.

### 7.7 Leyenda

En la esquina inferior derecha del mapa hay una leyenda con los colores de estado y una indicación de que podés hacer clic en el mapa para agregar paradas.

---

## 8. Fleteros (vista de recorrido)

Cuando seleccionás un usuario con rol **Fletero**, el panel lateral muestra la pestaña **Orden de fletero** con las rutas combinadas de todos los vendedores.

### 8.1 Seleccionar vendedores visibles

Si hay dos o más vendedores, aparece una sección **Vendedores visibles** debajo del selector de usuario. Activá o desactivá cada vendedor con los chips toggle para filtrar qué clientes se muestran.

### 8.2 Reordenar la ruta del fletero

El fletero puede arrastrar los clientes para crear su propio orden de recorrido, independiente del orden de cada vendedor. Este orden se guarda automáticamente.

### 8.3 Cambiar estados

El fletero también puede marcar clientes como completados o pendientes desde la lista.

### 8.4 Vista dividida de mapas

Cuando hay 2 o más vendedores seleccionados, aparece un botón flotante en el área del mapa:

- **Dividir**: muestra un mapa separado para cada vendedor, uno al lado del otro.
- **Combinar**: vuelve a mostrar todos los marcadores en un solo mapa.

Cada mapa dividido tiene un encabezado con el nombre del vendedor y es totalmente interactivo (marcadores, popups, cambio de estado, agregar clientes).

---

## 9. Imprimir ruta

### 9.1 Abrir el modal de impresión

En la parte inferior del panel lateral, hacé clic en el ícono de impresora.

### 9.2 Seleccionar qué imprimir

Dentro del modal podés seleccionar:

- **Usuario**: cualquier vendedor o fletero.
- **Día**: el día de la ruta (días de vendedor o días de fletero según el usuario seleccionado).

### 9.3 Vista previa

El modal muestra:

- Un mapa de la ruta (preview pequeño).
- Una tabla numerada con: N°, Nombre, Dirección, Teléfono.

### 9.4 Imprimir

Presioná el botón **Imprimir**. La impresión genera:

- **Página 1**: mapa de la ruta a tamaño completo (apaisado)
- **Página 2**: tabla con el listado de clientes

Usá la configuración de impresión de tu navegador para guardar como PDF o imprimir en papel.

---

## 10. Atajo para imprimir el mapa

En la esquina superior izquierda del mapa hay un ícono de impresora. Hacé clic para imprimir solo la vista actual del mapa (útil para una captura rápida).

---

## 11. Restablecer datos de demostración

En la esquina inferior izquierda (o inferior derecha en móvil) hay un botón circular de actualizar. Hacé clic para restablecer todos los datos a los valores de demostración originales. Se te pedirá confirmación antes de proceder.

> **Advertencia**: esto borra todos los datos actuales (usuarios, clientes, asignaciones) y los reemplaza con los datos de demostración.

---

## 12. Consejos útiles

- **Navegación rápida**: usá la pestaña **Catálogo** para tener una vista completa de todos los clientes, y la pestaña **Ruta** para concentrarte en el recorrido del día.
- **Estados en el mapa**: los colores de los marcadores te dan un vistazo rápido de cómo va la ruta sin necesidad de abrir el panel.
- **Fleteros**: si un fletero necesita ver menos vendedores, simplemente desactivá los que no correspondan en **Vendedores visibles**.
- **Corrección de ubicación**: si un cliente está mal ubicado en el mapa, arrastrá su marcador a la posición correcta.
