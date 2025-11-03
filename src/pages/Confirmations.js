import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Users, AlertCircle } from 'lucide-react';
import { eventsAPI, confirmationsAPI, playersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Confirmations = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showMultiConfirmModal, setShowMultiConfirmModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventConfirmations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, playersResponse] = await Promise.all([
        eventsAPI.getAll(),
        playersAPI.getAll()
      ]);
      
      setEvents(eventsResponse.data);
      setPlayers(playersResponse.data);
      
      // Selecionar evento atual automaticamente
      try {
        const currentEventResponse = await eventsAPI.getCurrent();
        setSelectedEvent(currentEventResponse.data);
      } catch (error) {
        // Se não houver evento atual, selecionar o primeiro da lista
        if (eventsResponse.data.length > 0) {
          setSelectedEvent(eventsResponse.data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadEventConfirmations = async () => {
    if (!selectedEvent) return;

    try {
      const [confirmationsResponse, confirmedResponse, waitingResponse] = await Promise.all([
        confirmationsAPI.getByEvent(selectedEvent.id),
        confirmationsAPI.getConfirmed(selectedEvent.id),
        confirmationsAPI.getWaiting(selectedEvent.id)
      ]);

      setConfirmations(confirmationsResponse.data);
      setConfirmedPlayers(confirmedResponse.data);
      setWaitingList(waitingResponse.data);
    } catch (error) {
      console.error('Erro ao carregar confirmações:', error);
      toast.error('Erro ao carregar confirmações');
    }
  };

  const handleConfirmPresence = async () => {
    if (!selectedPlayer || !selectedEvent) return;

    try {
      await confirmationsAPI.create({
        player_id: selectedPlayer,
        event_id: selectedEvent.id
      });
      
      toast.success('Presença confirmada com sucesso!');
      setShowConfirmModal(false);
      setSelectedPlayer('');
      loadEventConfirmations();
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      toast.error(error.response?.data?.error || 'Erro ao confirmar presença');
    }
  };

  const handleMultiConfirmPresence = async () => {
    if (selectedPlayers.length === 0 || !selectedEvent) return;

    try {
      // Confirmar presença para todos os jogadores selecionados
      const confirmPromises = selectedPlayers.map(playerId =>
        confirmationsAPI.create({
          player_id: playerId,
          event_id: selectedEvent.id
        })
      );

      await Promise.all(confirmPromises);
      
      toast.success(`${selectedPlayers.length} presenças confirmadas com sucesso!`);
      setShowMultiConfirmModal(false);
      setSelectedPlayers([]);
      loadEventConfirmations();
    } catch (error) {
      console.error('Erro ao confirmar presenças:', error);
      toast.error('Erro ao confirmar algumas presenças. Verifique os resultados.');
      loadEventConfirmations(); // Recarregar para ver quais foram confirmadas
    }
  };

  const handlePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleSelectAllPlayers = () => {
    const availablePlayers = getAvailablePlayers();
    if (selectedPlayers.length === availablePlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(availablePlayers.map(player => player.id));
    }
  };

  const handleCancelConfirmation = async (confirmationId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta confirmação?')) return;

    try {
      await confirmationsAPI.delete(confirmationId);
      toast.success('Confirmação cancelada com sucesso!');
      loadEventConfirmations();
    } catch (error) {
      console.error('Erro ao cancelar confirmação:', error);
      toast.error('Erro ao cancelar confirmação');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  const getAvailablePlayers = () => {
    const confirmedPlayerIds = confirmations.map(c => c.player_id);
    return players.filter(player => !confirmedPlayerIds.includes(player.id));
  };

  const getPositionDisplay = (position) => {
    const positions = {
      levantador: 'Levantador',
      libero: 'Líbero',
      atacante: 'Atacante',
      meio: 'Meio de Rede',
      oposto: 'Oposto',
      outros: 'Outros'
    };
    return positions[position] || position;
  };

  const getGenderDisplay = (gender) => {
    return gender === 'M' ? 'M' : 'F';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-green-100 text-green-800',
      5: 'bg-blue-100 text-blue-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Confirmações de Presença</h1>
          <p className="text-gray-600">Gerencie as confirmações para os eventos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn-primary flex items-center"
            disabled={!selectedEvent}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Confirmar Presença
          </button>
          
          <button
            onClick={() => setShowMultiConfirmModal(true)}
            className="btn-secondary flex items-center"
            disabled={!selectedEvent}
          >
            <Users className="h-4 w-4 mr-2" />
            Confirmação Múltipla
          </button>
        </div>
      </div>

      {/* Event Selection */}
      <div className="bg-white p-4 rounded-lg shadow card-shadow">
        <label className="form-label">Selecionar Evento</label>
        <select
          value={selectedEvent?.id || ''}
          onChange={(e) => {
            const event = events.find(ev => ev.id === e.target.value);
            setSelectedEvent(event);
          }}
          className="select-field max-w-md"
        >
          <option value="">Selecione um evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {formatDate(event.date)}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* Event Info */}
          <div className="bg-white rounded-lg shadow card-shadow overflow-hidden">
            <div className="px-6 py-4 bg-primary-600">
              <h3 className="text-lg font-semibold text-white">
                {selectedEvent.title}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Data:</span>
                  <div>{formatDate(selectedEvent.date)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Horário:</span>
                  <div>{formatTime(selectedEvent.time_start)} - {formatTime(selectedEvent.time_end)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Local:</span>
                  <div>{selectedEvent.location}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Limite:</span>
                  <div>{selectedEvent.max_players} jogadores</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow card-shadow">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmados</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {confirmedPlayers.length}/{selectedEvent.max_players}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow card-shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Espera</h3>
                  <p className="text-3xl font-bold text-yellow-600">{waitingList.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow card-shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total</h3>
                  <p className="text-3xl font-bold text-blue-600">{confirmations.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmed Players List */}
          <div className="bg-white rounded-lg shadow card-shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <h3 className="text-lg font-semibold text-green-900 flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Jogadores Confirmados ({confirmedPlayers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Gênero
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nível
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {confirmedPlayers.map((player, index) => {
                    const confirmation = confirmations.find(c => c.player_id === player.id);
                    return (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getPositionDisplay(player.position)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getGenderDisplay(player.gender)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Nível {player.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleCancelConfirmation(confirmation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {confirmedPlayers.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">Nenhum jogador confirmado ainda</div>
              </div>
            )}
          </div>

          {/* Waiting List */}
          {waitingList.length > 0 && (
            <div className="bg-white rounded-lg shadow card-shadow overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Lista de Espera ({waitingList.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {waitingList.map((confirmation, index) => (
                    <div key={confirmation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <span className="font-medium">#{index + 1} - {confirmation.players.name}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          ({getPositionDisplay(confirmation.players.position)}, 
                          {getGenderDisplay(confirmation.players.gender)}, 
                          Nível {confirmation.players.level})
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelConfirmation(confirmation.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Warning if not enough players */}
          {confirmedPlayers.length < 12 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">
                    Jogadores insuficientes para formar times
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    São necessários pelo menos 12 jogadores confirmados para gerar times equilibrados.
                    Atualmente temos {confirmedPlayers.length} jogadores confirmados.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Presença
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">Selecionar Jogador</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Selecione um jogador</option>
                    {getAvailablePlayers().map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} - {getPositionDisplay(player.position)} ({getGenderDisplay(player.gender)}, Nível {player.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedPlayer('');
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPresence}
                    disabled={!selectedPlayer}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi Confirmation Modal */}
      {showMultiConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmação Múltipla de Presença
              </h3>
              
              <div className="space-y-4">
                {/* Header com seleção */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSelectAllPlayers}
                      className="btn-secondary text-sm"
                    >
                      {selectedPlayers.length === getAvailablePlayers().length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                    <span className="text-sm text-gray-600">
                      {selectedPlayers.length} de {getAvailablePlayers().length} jogadores selecionados
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary-600">
                    {selectedPlayers.length > 0 && `${selectedPlayers.length} confirmações pendentes`}
                  </span>
                </div>

                {/* Lista de jogadores disponíveis */}
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <div className="grid gap-2 p-4">
                    {getAvailablePlayers().map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlayers.includes(player.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handlePlayerSelection(player.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedPlayers.includes(player.id)}
                            onChange={() => handlePlayerSelection(player.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div>
                            <span className="font-medium text-gray-900">{player.name}</span>
                            <div className="text-sm text-gray-600">
                              {getPositionDisplay(player.position)} • {getGenderDisplay(player.gender)} • Nível {player.level}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getPositionDisplay(player.position)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(player.level)}`}>
                            N{player.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {getAvailablePlayers().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Todos os jogadores já confirmaram presença para este evento.
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMultiConfirmModal(false);
                      setSelectedPlayers([]);
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMultiConfirmPresence}
                    disabled={selectedPlayers.length === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar {selectedPlayers.length} Presenças
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Confirmations;