import { fetchWithAuth } from '../utils/api';
import React, { useState } from 'react';
import { Edit, Save, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '../styles/ConfiguracionPage.module.css';

function SortablePregunta({ pregunta, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pregunta.id, data: { type: 'Pregunta', pregunta } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    border: isDragging ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
    background: 'white',
    padding: '1rem',
    marginBottom: '0.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94a3b8' }}>
        <GripVertical size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{pregunta.texto}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>[{pregunta.tipo_respuesta}]</div>
      </div>
      <button onClick={() => onEdit(pregunta)} className="btn" title="Editar">
        <Edit size={16} />
      </button>
    </div>
  );
}

function DroppableSeccion({ seccion, onEditPregunta }) {
  const { setNodeRef } = useSortable({
    id: `seccion-${seccion.id}`,
    data: { type: 'Seccion', seccion }
  });

  return (
    <div className={styles.seccionCard} ref={setNodeRef} style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1rem', borderRadius: '0.5rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {seccion.orden}. {seccion.titulo}
      </h3>
      <SortableContext id={`seccion-${seccion.id}`} items={seccion.preguntas.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div style={{ minHeight: '50px' }}>
          {seccion.preguntas.map(pregunta => (
            <SortablePregunta key={pregunta.id} pregunta={pregunta} onEdit={onEditPregunta} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PreguntasTab({ secciones, setSecciones, onEditPregunta, showSnackbar }) {
  const [activeId, setActiveId] = useState(null);
  const [activePregunta, setActivePregunta] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActivePregunta(active.data.current?.pregunta);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActivePregunta = active.data.current?.type === 'Pregunta';
    const isOverPregunta = over.data.current?.type === 'Pregunta';
    const isOverSeccion = over.data.current?.type === 'Seccion';

    if (!isActivePregunta) return;

    // Encontrar contenedores
    const activeSeccionIndex = secciones.findIndex(s => s.preguntas.some(p => p.id === activeId));
    let overSeccionIndex = -1;

    if (isOverPregunta) {
      overSeccionIndex = secciones.findIndex(s => s.preguntas.some(p => p.id === overId));
    } else if (isOverSeccion) {
      overSeccionIndex = secciones.findIndex(s => `seccion-${s.id}` === overId);
    }

    if (activeSeccionIndex === -1 || overSeccionIndex === -1) return;
    if (activeSeccionIndex === overSeccionIndex) return; // Mismo contenedor se maneja en onDragEnd

    // Mover de una sección a otra
    setSecciones((prev) => {
      const activeItems = [...prev[activeSeccionIndex].preguntas];
      const overItems = [...prev[overSeccionIndex].preguntas];
      const activeIndex = activeItems.findIndex(p => p.id === activeId);
      
      let overIndex = 0;
      if (isOverPregunta) {
        overIndex = overItems.findIndex(p => p.id === overId);
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        overIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      } else {
        overIndex = overItems.length + 1;
      }

      const [movedItem] = activeItems.splice(activeIndex, 1);
      overItems.splice(overIndex, 0, movedItem);

      const newSecciones = [...prev];
      newSecciones[activeSeccionIndex] = { ...newSecciones[activeSeccionIndex], preguntas: activeItems };
      newSecciones[overSeccionIndex] = { ...newSecciones[overSeccionIndex], preguntas: overItems };
      return newSecciones;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActivePregunta(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeSeccionIndex = secciones.findIndex(s => s.preguntas.some(p => p.id === activeId));
    let overSeccionIndex = secciones.findIndex(s => s.preguntas.some(p => p.id === overId));
    if (overSeccionIndex === -1) {
       overSeccionIndex = secciones.findIndex(s => `seccion-${s.id}` === overId);
    }

    if (activeSeccionIndex === -1 || overSeccionIndex === -1) return;

    let newSecciones = [...secciones];

    if (activeSeccionIndex === overSeccionIndex) {
      // Reordenar dentro de la misma sección
      const items = [...newSecciones[activeSeccionIndex].preguntas];
      const activeIndex = items.findIndex(p => p.id === activeId);
      const overIndex = items.findIndex(p => p.id === overId);

      if (activeIndex !== overIndex) {
        newSecciones[activeSeccionIndex].preguntas = arrayMove(items, activeIndex, overIndex);
        setSecciones(newSecciones);
      }
    }

    // Preparar el payload para guardar en base de datos
    // Enviamos el orden actual de TODAS las preguntas de la sección o secciones afectadas
    const payload = [];
    
    // Asignar el nuevo orden basado en la posición en el array
    newSecciones[activeSeccionIndex].preguntas.forEach((p, idx) => {
       payload.push({ pregunta_id: p.id, seccion_id: newSecciones[activeSeccionIndex].id, orden: idx + 1 });
    });
    
    if (activeSeccionIndex !== overSeccionIndex) {
       newSecciones[overSeccionIndex].preguntas.forEach((p, idx) => {
          payload.push({ pregunta_id: p.id, seccion_id: newSecciones[overSeccionIndex].id, orden: idx + 1 });
       });
    }

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/cuestionario/preguntas/reordenar`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Error al guardar el nuevo orden');
      }
      showSnackbar('Orden de preguntas actualizado exitosamente.');
    } catch (err) {
      showSnackbar('Error al guardar el nuevo orden: ' + err.message, 'error');
    }
  };

  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={styles.sectionsContainer}>
        {secciones.map(seccion => (
          <DroppableSeccion key={seccion.id} seccion={seccion} onEditPregunta={onEditPregunta} />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId && activePregunta ? (
          <div style={{ padding: '1rem', background: 'white', border: '1px solid var(--primary)', borderRadius: '0.5rem', opacity: 0.8 }}>
            <div style={{ fontWeight: 500 }}>{activePregunta.texto}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
