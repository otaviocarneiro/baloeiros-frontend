import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Clock, Users, Edit } from 'lucide-react';
import { eventsAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingEvent) {
        await eventsAPI.update(editingEvent.id, data);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await eventsAPI.create(data);
        toast.success('Evento criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingEvent(null);
      reset();
      loadEvents();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    reset({
      ...event,
      date: event.date.split('T')[0], // Format for input[type="date"]
    });
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  const isEventPast = (date) => {
    return new Date(date) < new Date();
  };

  const isEventToday = (date) => {
    const today = new Date();
    const eventDate = new Date(date);
    return today.toDateString() === eventDate.toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Eventos</h1>
          <p className="text-gray-600">Crie e organize os jogos de vôlei</p>
        </div>
        
        <button
          onClick={() => {
            setEditingEvent(null);
            reset();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className={`bg-white rounded-lg shadow card-shadow overflow-hidden border-l-4 ${
              isEventToday(event.date)
                ? 'border-green-500'
                : isEventPast(event.date)
                ? 'border-gray-400'
                : 'border-primary-500'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                <button
                  onClick={() => handleEdit(event)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {formatDate(event.date)}
                    {isEventToday(event.date) && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Hoje
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {formatTime(event.time_start)} - {formatTime(event.time_end)}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{event.location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">Máximo {event.max_players} jogadores</span>
                </div>

                {event.description && (
                  <div className="text-gray-600 text-sm mt-3">
                    <p className="line-clamp-2">{event.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isEventPast(event.date)
                      ? 'bg-gray-100 text-gray-600'
                      : isEventToday(event.date)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isEventPast(event.date)
                      ? 'Finalizado'
                      : isEventToday(event.date)
                      ? 'Hoje'
                      : 'Próximo'
                    }
                  </span>
                  
                  <button
                    onClick={() => window.location.href = `/confirmations?event=${event.id}`}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Ver Confirmações →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando um novo evento de vôlei.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setEditingEvent(null);
                reset();
                setShowModal(true);
              }}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    {...register('title', { required: 'Título é obrigatório' })}
                    className="input-field"
                    placeholder="Ex: Vôlei Campo dos Alemães"
                  />
                  {errors.title && <p className="form-error">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      {...register('date', { required: 'Data é obrigatória' })}
                      className="input-field"
                    />
                    {errors.date && <p className="form-error">{errors.date.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Máx. Jogadores *</label>
                    <input
                      type="number"
                      min="6"
                      max="50"
                      {...register('max_players', { 
                        required: 'Número máximo é obrigatório',
                        min: { value: 6, message: 'Mínimo 6 jogadores' },
                        max: { value: 50, message: 'Máximo 50 jogadores' }
                      })}
                      className="input-field"
                      placeholder="18"
                    />
                    {errors.max_players && <p className="form-error">{errors.max_players.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Horário Início *</label>
                    <input
                      type="time"
                      {...register('time_start', { required: 'Horário de início é obrigatório' })}
                      className="input-field"
                    />
                    {errors.time_start && <p className="form-error">{errors.time_start.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Horário Fim *</label>
                    <input
                      type="time"
                      {...register('time_end', { required: 'Horário de fim é obrigatório' })}
                      className="input-field"
                    />
                    {errors.time_end && <p className="form-error">{errors.time_end.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="form-label">Local *</label>
                  <input
                    type="text"
                    {...register('location', { required: 'Local é obrigatório' })}
                    className="input-field"
                    placeholder="Ex: Campo dos Alemães"
                  />
                  {errors.location && <p className="form-error">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="form-label">Descrição</label>
                  <textarea
                    {...register('description')}
                    className="input-field"
                    rows="3"
                    placeholder="Informações adicionais sobre o evento..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingEvent(null);
                      reset();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingEvent ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;