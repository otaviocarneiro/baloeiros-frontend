import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Upload, Download, FileText } from 'lucide-react';
import { playersAPI, csvAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, searchTerm, filterPosition, filterGender]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await playersAPI.getAll();
      setPlayers(response.data);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar jogadores');
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = players;

    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPosition) {
      filtered = filtered.filter(player => player.position === filterPosition);
    }

    if (filterGender) {
      filtered = filtered.filter(player => player.gender === filterGender);
    }

    setFilteredPlayers(filtered);
  };

  const onSubmit = async (data) => {
    try {
      if (editingPlayer) {
        await playersAPI.update(editingPlayer.id, data);
        toast.success('Jogador atualizado com sucesso!');
      } else {
        await playersAPI.create(data);
        toast.success('Jogador criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingPlayer(null);
      reset();
      loadPlayers();
    } catch (error) {
      console.error('Erro ao salvar jogador:', error);
      toast.error('Erro ao salvar jogador');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    reset(player);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este jogador?')) {
      try {
        await playersAPI.delete(id);
        toast.success('Jogador excluído com sucesso!');
        loadPlayers();
      } catch (error) {
        console.error('Erro ao excluir jogador:', error);
        toast.error('Erro ao excluir jogador');
      }
    }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const response = await csvAPI.import(file);
      toast.success(`${response.data.imported} jogadores importados com sucesso!`);
      
      if (response.data.errors > 0) {
        toast.error(`${response.data.errors} erros encontrados na importação`);
        console.log('Erros:', response.data.errorDetails);
      }
      
      loadPlayers();
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar arquivo CSV');
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleCsvExport = async () => {
    try {
      const response = await csvAPI.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'jogadores.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Arquivo exportado com sucesso!');
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar arquivo CSV');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await csvAPI.getTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_jogadores.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast.error('Erro ao baixar template');
    }
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
    return gender === 'M' ? 'Masculino' : 'Feminino';
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Jogadores</h1>
          <p className="text-gray-600">Cadastre e organize os jogadores do seu time</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => {
              setEditingPlayer(null);
              reset();
              setShowModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Jogador
          </button>
          
          <div className="flex space-x-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
              id="csv-import"
            />
            <label
              htmlFor="csv-import"
              className="btn-secondary flex items-center cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </label>
            
            <button
              onClick={handleCsvExport}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Template
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow card-shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar jogadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="select-field"
          >
            <option value="">Todas as posições</option>
            <option value="levantador">Levantador</option>
            <option value="libero">Líbero</option>
            <option value="atacante">Atacante</option>
            <option value="meio">Meio de Rede</option>
            <option value="oposto">Oposto</option>
            <option value="outros">Outros</option>
          </select>
          
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="select-field"
          >
            <option value="">Todos os gêneros</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          
          <div className="text-sm text-gray-600 flex items-center">
            Total: {filteredPlayers.length} jogadores
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-white shadow card-shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gênero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{player.name}</div>
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(player.level)}`}>
                      Nível {player.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{player.phone || '-'}</div>
                    <div className="text-gray-500">{player.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(player)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {players.length === 0 
                ? 'Nenhum jogador cadastrado ainda' 
                : 'Nenhum jogador encontrado com os filtros aplicados'
              }
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="input-field"
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Gênero *</label>
                  <select
                    {...register('gender', { required: 'Gênero é obrigatório' })}
                    className="select-field"
                  >
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                  {errors.gender && <p className="form-error">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="form-label">Posição *</label>
                  <select
                    {...register('position', { required: 'Posição é obrigatória' })}
                    className="select-field"
                  >
                    <option value="">Selecione</option>
                    <option value="levantador">Levantador</option>
                    <option value="libero">Líbero</option>
                    <option value="atacante">Atacante</option>
                    <option value="meio">Meio de Rede</option>
                    <option value="oposto">Oposto</option>
                    <option value="outros">Outros</option>
                  </select>
                  {errors.position && <p className="form-error">{errors.position.message}</p>}
                </div>

                <div>
                  <label className="form-label">Nível (1-5) *</label>
                  <select
                    {...register('level', { required: 'Nível é obrigatório' })}
                    className="select-field"
                  >
                    <option value="">Selecione</option>
                    <option value={1}>1 - Iniciante</option>
                    <option value={2}>2 - Básico</option>
                    <option value={3}>3 - Intermediário</option>
                    <option value={4}>4 - Avançado</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                  {errors.level && <p className="form-error">{errors.level.message}</p>}
                </div>

                <div>
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input-field"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field"
                    placeholder="jogador@email.com"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPlayer(null);
                      reset();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingPlayer ? 'Atualizar' : 'Criar'}
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

export default Players;