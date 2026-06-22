import React, { useState } from 'react';
import { Edit, Save, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
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

function SortableSeccion({ seccion, editingSeccionId, setEditingSeccionId, seccionForm, setSeccionForm, saveSeccion }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: seccion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
    background: 'white'
  };

  const isEditing = editingSeccionId === seccion.id;

  return (
    <div ref={setNodeRef} style={style} className={styles.listItem}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94a3b8', marginRight: '0.5rem' }}>
        <GripVertical size={20} />
      </div>
      
      {isEditing ? (
        <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
          <input 
            type="text" 
            value={seccionForm.titulo} 
            onChange={(e) => setSeccionForm({...seccionForm, titulo: e.target.value})}
            className={styles.formInput}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => saveSeccion(seccion.id)}><Save size={16} /></button>
          <button className="btn" onClick={() => setEditingSeccionId(null)}><X size={16} /></button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>{seccion.orden}.</strong> {seccion.titulo}</span>
          <button className="btn" onClick={() => { 
            setEditingSeccionId(seccion.id); 
            setSeccionForm({titulo: seccion.titulo, orden: seccion.orden}); 
          }}>
            <Edit size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SeccionesTab({ secciones, setSecciones, fetchDataForTab, showSnackbar }) {
  const [editingSeccionId, setEditingSeccionId] = useState(null);
  const [seccionForm, setSeccionForm] = useState({ titulo: '', orden: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveSeccion = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/cuestionario/secciones/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(seccionForm)
      });
      if (!res.ok) throw new Error('Error al actualizar sección');
      setEditingSeccionId(null);
      fetchDataForTab('secciones', true);
      showSnackbar('Sección actualizada exitosamente.');
    } catch (err) {
      showSnackbar('Error al actualizar sección: ' + err.message, 'error');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = secciones.findIndex(s => s.id === active.id);
    const newIndex = secciones.findIndex(s => s.id === over.id);

    const newSecciones = arrayMove(secciones, oldIndex, newIndex);
    
    // Asignar nuevo orden basado en la nueva posición
    const updatedSecciones = newSecciones.map((s, index) => ({
      ...s,
      orden: index + 1
    }));

    setSecciones(updatedSecciones);

    // Guardar en backend
    const payload = updatedSecciones.map(s => ({ seccion_id: s.id, orden: s.orden }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/cuestionario/secciones/reordenar`, {
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
      showSnackbar('Orden de secciones actualizado exitosamente.');
    } catch (err) {
      showSnackbar('Error al guardar el nuevo orden: ' + err.message, 'error');
    }
  };

  return (
    <div className={styles.tabContentBlock}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Gestión de Secciones</h2>
      </div>
      <div className={styles.listContainer}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={secciones.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {secciones.map(sec => (
              <SortableSeccion 
                key={sec.id} 
                seccion={sec} 
                editingSeccionId={editingSeccionId}
                setEditingSeccionId={setEditingSeccionId}
                seccionForm={seccionForm}
                setSeccionForm={setSeccionForm}
                saveSeccion={saveSeccion}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
