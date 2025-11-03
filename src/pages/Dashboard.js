import React, { useState, useEffect } from 'react';
import { Calendar, Users, UserCheck, Trophy } from 'lucide-react';
import { eventsAPI, playersAPI, confirmationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalEvents: 0,
    confirmedPlayers: 0,
    nextEvent: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas em paralelo
      const [playersResponse, eventsResponse] = await Promise.all([
        playersAPI.getAll(),
        eventsAPI.getAll(),
      ]);

      const totalPlayers = playersResponse.data.length;
      const totalEvents = eventsResponse.data.length;
      
      // Buscar próximo evento
      let nextEvent = null;
      let confirmedPlayers = 0;
      
      try {
        const currentEventResponse = await eventsAPI.getCurrent();
        nextEvent = currentEventResponse.data;
        
        if (nextEvent) {
          const confirmedResponse = await confirmationsAPI.getConfirmed(nextEvent.id);
          confirmedPlayers = confirmedResponse.data.length;
        }
      } catch (error) {
        // Se não houver evento atual, tudo bem
        console.log('Nenhum evento futuro encontrado');
      }

      setStats({
        totalPlayers,
        totalEvents,
        confirmedPlayers,
        nextEvent,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // Remove os segundos
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏐 VoleiConfirma Dashboard
        </h1>
        <p className="text-xl text-gray-600">
          Gerencie seu time de vôlei de forma simples e eficiente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Jogadores
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.totalPlayers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Eventos
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.totalEvents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Confirmados (Próximo)
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.confirmedPlayers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Status
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {stats.confirmedPlayers >= 12 ? 'Pronto!' : 'Aguardando'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Event Card */}
      {stats.nextEvent && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden card-shadow">
          <div className="px-6 py-4 bg-primary-600">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Próximo Evento
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {stats.nextEvent.title}
                </h4>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <strong>📅 Data:</strong> {formatDate(stats.nextEvent.date)}
                  </p>
                  <p>
                    <strong>🕐 Horário:</strong> {formatTime(stats.nextEvent.time_start)} - {formatTime(stats.nextEvent.time_end)}
                  </p>
                  <p>
                    <strong>📍 Local:</strong> {stats.nextEvent.location}
                  </p>
                  <p>
                    <strong>👥 Limite:</strong> {stats.nextEvent.max_players} jogadores
                  </p>
                </div>
              </div>
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Status das Confirmações</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Confirmados:</span>
                      <span className="font-bold text-green-600">
                        {stats.confirmedPlayers}/{stats.nextEvent.max_players}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{
                          width: `${Math.min((stats.confirmedPlayers / stats.nextEvent.max_players) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stats.confirmedPlayers >= 12 
                        ? '✅ Times podem ser formados!' 
                        : `❌ Precisamos de pelo menos ${12 - stats.confirmedPlayers} jogadores para formar times`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden card-shadow">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/players'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
            >
              <Users className="h-8 w-8 text-gray-400 mr-3" />
              <span className="text-gray-600 font-medium">Gerenciar Jogadores</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/events'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
            >
              <Calendar className="h-8 w-8 text-gray-400 mr-3" />
              <span className="text-gray-600 font-medium">Criar Evento</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/teams'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
            >
              <Trophy className="h-8 w-8 text-gray-400 mr-3" />
              <span className="text-gray-600 font-medium">Sortear Times</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Como usar o VoleiConfirma</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h4 className="font-medium mb-2">1. Cadastre os Jogadores</h4>
            <p className="text-sm">Adicione todos os jogadores com suas informações básicas como posição, nível e gênero.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Crie um Evento</h4>
            <p className="text-sm">Configure data, horário, local e número máximo de participantes.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Confirme Presenças</h4>
            <p className="text-sm">Os jogadores confirmam presença e são organizados automaticamente.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">4. Sorteie os Times</h4>
            <p className="text-sm">O sistema equilibra automaticamente os times considerando posições e níveis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;