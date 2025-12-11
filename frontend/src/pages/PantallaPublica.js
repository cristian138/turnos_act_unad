import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';

const PantallaPublica = () => {
  const [turnosLlamados, setTurnosLlamados] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const { socket } = useSocket();
  const audioContextRef = useRef(null);
  const [sonando, setSonando] = useState(false);
  const intervaloSonidoRef = useRef(null);

  // Función para reproducir sonido de notificación
  const reproducirSonido = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800; // Frecuencia del tono
    oscillator.type = 'sine'; // Tipo de onda
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  };

  const iniciarSonidoRepetitivo = () => {
    setSonando(true);
    reproducirSonido();
    intervaloSonidoRef.current = setInterval(() => {
      reproducirSonido();
    }, 2000); // Repetir cada 2 segundos
  };

  const detenerSonido = () => {
    setSonando(false);
    if (intervaloSonidoRef.current) {
      clearInterval(intervaloSonidoRef.current);
      intervaloSonidoRef.current = null;
    }
  };

  useEffect(() => {
    cargarTurnosLlamados();

    const interval = setInterval(cargarTurnosLlamados, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('turno_llamado', (turno) => {
        setTurnoActual(turno);
        iniciarSonidoRepetitivo(); // Iniciar sonido cuando se llama
        cargarTurnosLlamados();
      });

      socket.on('turno_atendiendo', (turno) => {
        setTurnoActual(turno);
        detenerSonido(); // Detener sonido cuando pasa a atender
        cargarTurnosLlamados();
      });

      socket.on('turno_finalizado', () => {
        detenerSonido();
        cargarTurnosLlamados();
      });

      return () => {
        socket.off('turno_llamado');
        socket.off('turno_atendiendo');
        socket.off('turno_finalizado');
        detenerSonido();
      };
    }
  }, [socket]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      detenerSonido();
    };
  }, []);

  const cargarTurnosLlamados = async () => {
    try {
      const response = await api.turnos.obtenerLlamadosRecientes();
      setTurnosLlamados(response.data);
      if (response.data.length > 0 && response.data[0].estado === 'llamado') {
        setTurnoActual(response.data[0]);
      }
    } catch (error) {
      console.error('Error al cargar turnos llamados:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white" data-testid="pantalla-publica">
      <div className="grid grid-cols-12 h-screen">
        <div className="col-span-8 flex flex-col p-8">
          <div className="border-b border-slate-700 pb-6 mb-6 flex items-center space-x-4">
            <img src="/logo-unad.png" alt="UNAD Logo" className="h-20 drop-shadow-2xl" />
            <div>
              <p className="text-xl text-slate-300">Sistema de Gestión de Turnos</p>
            </div>
          </div>

          {turnoActual && turnoActual.estado === 'llamado' ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
              <p className="text-3xl text-slate-400 mb-4">Turno Actual</p>
              <p className="font-mono text-9xl font-black text-primary mb-6 animate-pulse">
                {turnoActual.codigo}
              </p>
              <p className="text-4xl text-white mb-4">{turnoActual.servicio_nombre}</p>
              {turnoActual.funcionario_nombre && (
                <p className="text-2xl text-slate-400">
                  Atención: {turnoActual.funcionario_nombre}
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-3xl text-slate-500">Esperando próximo turno...</p>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-slate-800 p-6 overflow-y-auto">
          <h2 className="text-2xl font-heading font-bold mb-6 text-white">Turnos Recientes</h2>
          <div className="space-y-3">
            {turnosLlamados.map((turno, index) => (
              <div
                key={turno.id}
                className={`p-4 rounded-lg border-l-4 ${
                  index === 0 && turno.estado === 'llamado'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-slate-700 border-slate-600'
                }`}
                data-testid={`turno-reciente-${turno.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-2xl font-bold text-white">
                    {turno.codigo}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      turno.estado === 'llamado'
                        ? 'bg-accent text-black'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {turno.estado === 'llamado' ? 'En Atención' : 'Cerrado'}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{turno.servicio_nombre}</p>
                {turno.funcionario_nombre && (
                  <p className="text-xs text-slate-400 mt-1">
                    {turno.funcionario_nombre}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PantallaPublica;
