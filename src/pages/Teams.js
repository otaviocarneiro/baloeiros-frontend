import React, { useState, useEffect } from 'react';
import { Trophy, Users, Shuffle, BarChart3, AlertCircle } from 'lucide-react';
import { eventsAPI, teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Teams = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPlayers, setEventPlayers] = useState(null);
  const [generatedTeams, setGeneratedTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventPlayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data);
      
      // Selecionar evento atual automaticamente
      try {
        const currentEventResponse = await eventsAPI.getCurrent();
        setSelectedEvent(currentEventResponse.data);
      } catch (error) {
        // Se não houver evento atual, selecionar o primeiro da lista
        if (response.data.length > 0) {
          setSelectedEvent(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const loadEventPlayers = async () => {
    if (!selectedEvent) return;

    try {
      const response = await teamsAPI.getPlayers(selectedEvent.id);
      setEventPlayers(response.data);
      setGeneratedTeams(null); // Reset teams when changing event
    } catch (error) {
      console.error('Erro ao carregar jogadores do evento:', error);
      toast.error('Erro ao carregar jogadores do evento');
    }
  };

  const generateTeams = async () => {
    if (!selectedEvent) return;

    try {
      setGenerating(true);
      const response = await teamsAPI.generate(selectedEvent.id);
      setGeneratedTeams(response.data);
      toast.success('Times gerados com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar times:', error);
      toast.error(error.response?.data?.error || 'Erro ao gerar times');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getPositionDisplay = (position) => {
    const positions = {
      levantador: 'Levantador',
      libero: 'Líbero',
      atacante: 'Atacante',
      meio: 'Meio',
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

  const getTeamColor = (teamNumber) => {
    const colors = {
      1: 'border-blue-500 bg-blue-50',
      2: 'border-red-500 bg-red-50'
    };
    return colors[teamNumber] || 'border-gray-500 bg-gray-50';
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
          <h1 className="text-3xl font-bold text-gray-900">Sorteio de Times</h1>
          <p className="text-gray-600">Gere times equilibrados automaticamente</p>
        </div>
        
        <button
          onClick={generateTeams}
          disabled={!selectedEvent || !eventPlayers || eventPlayers.players.length < 12 || generating}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Gerando...
            </>
          ) : (
            <>
              <Shuffle className="h-4 w-4 mr-2" />
              Sortear Times
            </>
          )}
        </button>
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

      {/* Event Players Stats */}
      {eventPlayers && (
        <div className="bg-white rounded-lg shadow card-shadow overflow-hidden">
          <div className="px-6 py-4 bg-primary-600">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estatísticas dos Jogadores Confirmados
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Players */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{eventPlayers.stats.total}</div>
                <div className="text-sm text-gray-600">Total de Jogadores</div>
              </div>

              {/* Gender Distribution */}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {eventPlayers.stats.byGender.men}M / {eventPlayers.stats.byGender.women}F
                </div>
                <div className="text-sm text-gray-600">Distribuição por Gênero</div>
              </div>

              {/* Average Level */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{eventPlayers.stats.averageLevel}</div>
                <div className="text-sm text-gray-600">Nível Médio</div>
              </div>

              {/* Key Positions */}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {eventPlayers.stats.byPosition.levantador}L / {eventPlayers.stats.byPosition.libero}Li
                </div>
                <div className="text-sm text-gray-600">Levantadores / Líberos</div>
              </div>
            </div>

            {/* Position Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Distribuição por Posição</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.levantador}</div>
                  <div className="text-gray-600">Levantador</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.libero}</div>
                  <div className="text-gray-600">Líbero</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.atacante}</div>
                  <div className="text-gray-600">Atacante</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.meio}</div>
                  <div className="text-gray-600">Meio</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.oposto}</div>
                  <div className="text-gray-600">Oposto</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{eventPlayers.stats.byPosition.outros}</div>
                  <div className="text-gray-600">Outros</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning if not enough players */}
      {eventPlayers && eventPlayers.stats.total < 12 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Jogadores insuficientes para formar times
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                São necessários pelo menos 12 jogadores confirmados para gerar times equilibrados.
                Atualmente temos {eventPlayers.stats.total} jogadores confirmados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Teams */}
      {generatedTeams && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow card-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Resumo do Sorteio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Jogadores Confirmados:</span>
                <div className="text-lg font-bold">{generatedTeams.summary.totalConfirmedPlayers}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Jogadores nos Times:</span>
                <div className="text-lg font-bold text-green-600">{generatedTeams.summary.playersInTeams}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Jogadores no Banco:</span>
                <div className="text-lg font-bold text-orange-600">{generatedTeams.summary.playersOnBench}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Diferença de Nível:</span>
                <div className="text-lg font-bold text-blue-600">{generatedTeams.summary.averageLevelDifference}</div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generatedTeams.teams.map((team) => (
              <div key={team.teamNumber} className={`bg-white rounded-lg shadow card-shadow overflow-hidden border-l-4 ${getTeamColor(team.teamNumber)}`}>
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                    <span>Time {team.teamNumber}</span>
                    <span className="text-sm font-normal text-gray-600">
                      Nível Médio: {team.averageLevel}
                    </span>
                  </h3>
                </div>
                <div className="p-6">
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-center">
                    <div>
                      <div className="font-semibold">{team.totalPlayers}</div>
                      <div className="text-gray-600">Jogadores</div>
                    </div>
                    <div>
                      <div className="font-semibold">{team.menCount}M / {team.womenCount}F</div>
                      <div className="text-gray-600">Distribuição</div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {team.hasSetter ? '✅' : '❌'} / {team.hasLibero ? '✅' : '❌'}
                      </div>
                      <div className="text-gray-600">Lev. / Líb.</div>
                    </div>
                  </div>

                  {/* Players List */}
                  <div className="space-y-2">
                    {team.players.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{player.name}</span>
                          <span className="text-sm text-gray-600">
                            ({getGenderDisplay(player.gender)})
                          </span>
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

                  {/* Position Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <strong>Posições:</strong> 
                      {team.positions.levantador > 0 && ` ${team.positions.levantador} Lev.`}
                      {team.positions.libero > 0 && ` ${team.positions.libero} Líb.`}
                      {team.positions.atacante > 0 && ` ${team.positions.atacante} Ata.`}
                      {team.positions.meio > 0 && ` ${team.positions.meio} Meio`}
                      {team.positions.oposto > 0 && ` ${team.positions.oposto} Opo.`}
                      {team.positions.outros > 0 && ` ${team.positions.outros} Out.`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bench Players */}
          {generatedTeams.benchPlayers.length > 0 && (
            <div className="bg-white rounded-lg shadow card-shadow overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Jogadores no Banco ({generatedTeams.benchPlayers.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedTeams.benchPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-600">
                          ({getGenderDisplay(player.gender)})
                        </span>
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
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedEvent && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento selecionado</h3>
          <p className="mt-1 text-sm text-gray-500">Selecione um evento para ver os jogadores e gerar times.</p>
        </div>
      )}
    </div>
  );
};

export default Teams;