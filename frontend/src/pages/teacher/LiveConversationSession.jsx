import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Mic,
    MicOff,
    PhoneOff,
    Languages,
    Volume2,
    Users,
    Loader2,
    Radio,
    GraduationCap,
    Phone,
    Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { translationService } from '../../services/translationService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useSessionContext } from '../../context/SessionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBranding } from '../../context/BrandingContext';

// Persisted so an in-progress session survives a page refresh (navigation state is lost on reload)
const SESSION_KEY = 'activeLiveConversation_teacher';

const LiveConversationSession = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Student comes from navigation state; fall back to persisted session on refresh
    const [student] = useState(() => {
        if (location.state?.student) return location.state.student;
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) return JSON.parse(saved);
        } catch (_) { /* ignore malformed storage */ }
        return null;
    });
    const { socket } = useSocket();
    const { user } = useAuth();
    const { getVoiceMode } = useLanguage();
    const { premiumTTS } = useBranding();
    const { setIsSessionActive: setGlobalSessionActive, setSessionEnded: setGlobalSessionEnded } = useSessionContext();

    // Student Status State
    const [isStudentOnline, setIsStudentOnline] = useState(student?.is_online || false);

    // Call State
    const [duration, setDuration] = useState('00:00');
    const [time, setTime] = useState(0);
    const [isConnected, setIsConnected] = useState(false); // Connection status
    const [sessionEnded, setSessionEnded] = useState(false);
    const [wasDeclined, setWasDeclined] = useState(false); // Track if student declined
    const [dbSessionId, setDbSessionId] = useState(null); // Database Session ID

    // Check for active session on mount
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const res = await api.getActiveSession();
                if (res.success && res.active) {
                    const session = res.data;
                    setDbSessionId(session.id);
                    setIsConnected(true); // Assuming socket reconnects automatically or handles it
                    setGlobalSessionActive(true);

                    // Sync Timer
                    const startTime = new Date(session.start_time).getTime();
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    setTime(elapsedSeconds > 0 ? elapsedSeconds : 0);

                    // If we don't have student state (refresh), we might need to fetch it?
                    // Currently relying on location.state. If null, UI shows error. 
                    // Ideally checkActiveSession would return student info and we populate it.
                    // But for this iteration, we assume flow starts from list or state is preserved.
                }
            } catch (err) {
                console.error('Failed to check active session', err);
            }
        };
        // Only check if we are not already connected? Or always?
        if (!isConnected) {
            checkActiveSession();
        }
    }, []);

    // Translation State
    const [isListening, setIsListening] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [messages, setMessages] = useState([]);
    const [targetLang, setTargetLang] = useState(student?.language || student?.preferred_language || 'English');

    // Auto-scroll refs
    const teacherEndRef = useRef(null);
    const studentEndRef = useRef(null);

    // Speech Buffering
    const transcriptBuffer = useRef('');
    const translationTimeout = useRef(null);
    const isEndingSession = useRef(false); // Track if we ended the session vs student

    // Socket Room ID
    const roomId = user && student ? `session_${user.id}_${student.id}` : null;

    // Manage Global Session State - Block Navigation & Cleanup
    const roomIdRef = useRef(null);
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

    // Cleanup ONLY on Unmount (a real page refresh tears down JS without running this,
    // so sessionStorage survives refresh but is cleared on intentional navigation)
    useEffect(() => {
        return () => {
            setGlobalSessionActive(false);
            translationService.stopListening();

            if (roomIdRef.current) {
                socket?.emit('leave_session', { roomId: roomIdRef.current });
            }
            sessionStorage.removeItem(SESSION_KEY);
        };
    }, []);

    // Set Active State on Mount/Update (No cleanup side effects)
    useEffect(() => {
        if (roomId || isConnected) {
            setGlobalSessionActive(true);
            setGlobalSessionEnded(false);
        }
    }, [roomId, isConnected]);

    // Scroll to bottom when messages change
    useEffect(() => {
        teacherEndRef.current?.scrollIntoView({ behavior: "smooth" });
        studentEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentTranscript]);

    // Timer logic (only when connected and not ended)
    useEffect(() => {
        if (!isConnected || sessionEnded) return;
        const timer = setInterval(() => setTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [isConnected, sessionEnded]);

    // Format time
    useEffect(() => {
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = (time % 60).toString().padStart(2, '0');
        setDuration(`${mins}:${secs}`);
    }, [time]);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if (!socket || !roomId || !student) return;

        // Persist for refresh recovery while the session is in progress
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(student));
        } catch (_) { /* ignore */ }

        // 1. Join Room
        socket.emit('join_session', roomId);

        // 2. Send Invite
        const teacherName = user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || 'Teacher';

        socket.emit('session_invite', {
            studentId: student.id,
            teacherName: teacherName,
            teacherImage: user?.profile_image || user?.profileImage || null,
            roomId
        });

        // Listen for user status changes
        const handleUserOnline = ({ userId }) => {
            if (String(userId) === String(student.id)) {
                setIsStudentOnline(true);
            }
        };

        const handleUserOffline = ({ userId }) => {
            if (String(userId) === String(student.id)) {
                setIsStudentOnline(false);
            }
        };

        socket.on('user_online', handleUserOnline);
        socket.on('user_offline', handleUserOffline);

        // 3. Listeners
        const handleAccepted = async () => {
            setIsConnected(true);
            setGlobalSessionActive(true);
            toast.success(`${student.first_name} joined the session!`);

            // Start Tracking in DB
            try {
                const res = await api.startSession(student.id);
                if (res.success) {
                    setDbSessionId(res.data.id);
                    setTime(0); // Reset timer to 0 on new start
                }
            } catch (err) {
                console.error('Failed to start session in DB', err);
            }
        };

        const handleRemoteSpeech = (data) => {
            // Received from Student (Native -> English)
            // data.original = Native (e.g. Spanish)
            // data.translated = English (Target for teacher)

            const newMessage = {
                id: Date.now(),
                type: 'remote', // from student
                original: data.original,
                translated: data.translated,
                timestamp: new Date().toLocaleTimeString()
            };

            setMessages(prev => [...prev, newMessage]);

            // Auto-play the English translation (teacher always hears English)
            if (data.translated) {
                setTimeout(() => {
                    translationService.speakText(data.translated, 'en-US', getVoiceMode('en', premiumTTS))
                        .catch(() => {});
                }, 300);
            }
        };

        const handleEnded = () => {
            setSessionEnded(true);
            setGlobalSessionEnded(true);
            sessionStorage.removeItem(SESSION_KEY);

            if (isListening) {
                translationService.stopListening();
                setIsListening(false);
            }

            // Only show error if WE didn't initiate the end
            if (!isEndingSession.current) {
                toast.error('Session ended by student.');
            }
        };

        const handleDeclined = () => {
            setWasDeclined(true);
            toast.error(`${student.first_name} declined the session request.`);
        };

        // Presence Check Listener
        const handlePresenceAck = () => {
            if (!isConnected) {
                handleAccepted();
            }
        };

        socket.on('session_accepted', handleAccepted);
        socket.on('session_speech', handleRemoteSpeech);
        socket.on('session_ended', handleEnded);
        socket.on('session_declined', handleDeclined);
        socket.on('session_presence_ack', handlePresenceAck);

        return () => {
            socket.off('user_online', handleUserOnline);
            socket.off('user_offline', handleUserOffline);
            socket.off('session_accepted', handleAccepted);
            socket.off('session_speech', handleRemoteSpeech);
            socket.off('session_ended', handleEnded);
            socket.off('session_declined', handleDeclined);
            socket.off('session_presence_ack', handlePresenceAck);

            // Only leave if explicitly ending/navigating, handled by cleanup effect
        };
    }, [socket, roomId, student, user, navigate]); // Removed isConnected to avoid re-binding

    // Polling for Presence & Ensuring Room Join (Retries)
    useEffect(() => {
        if (!isConnected && socket && roomId) {
            const interval = setInterval(() => {
                // Ensure we are in the room (Idempotent-ish)
                socket.emit('join_session', roomId);
                // Send presence check
                socket.emit('session_check_presence', { roomId });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isConnected, socket, roomId]);


    const handleEndCall = async () => {
        isEndingSession.current = true; // Mark that we are ending it intentionally
        translationService.stopListening();
        setIsListening(false);
        setSessionEnded(true);
        setGlobalSessionEnded(true);
        sessionStorage.removeItem(SESSION_KEY);

        if (socket && roomId) {
            socket.emit('end_session', roomId);
            // Notify student that teacher cancelled the request
            if (!isConnected) {
                socket.emit('session_cancelled', roomId);
            }
        }

        // End in DB
        if (dbSessionId) { // Use ID if we have it
            try {
                const res = await api.endSession(dbSessionId);
                if (res.success) {
                    toast.success(res.message); // "Session ended. X minutes deducted"
                }
            } catch (err) {
                console.error('Failed to end session DB', err);
            }
        } else if (isConnected) {
            // Fallback if we don't have ID but were connected (maybe recovered session failed?)
            // Try to end by teacher ID (backend handles active session lookup)
            try {
                const res = await api.endSession();
                if (res.data.success) {
                    toast.success(res.data.message);
                }
            } catch (err) { console.error(err); }
        } else {
            toast.success("Session finished");
        }

        // Only navigate back if we were waiting (Cancel Request), otherwise stay (End Session)
        if (!isConnected && !dbSessionId) {
            navigate('/teacher/live-conversation');
        }
    };

    const handleSendRequestAgain = () => {
        setWasDeclined(false);

        // Re-send the invitation
        const teacherName = user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || 'Teacher';

        if (socket && roomId) {
            socket.emit('session_invite', {
                studentId: student.id,
                teacherName: teacherName,
                teacherImage: user?.profile_image || user?.profileImage || null,
                roomId
            });
        }

        toast.success("Request sent again!");
    };

    // Helper to process/translate buffered text
    const processBuffer = async () => {
        const textToTranslate = transcriptBuffer.current;
        if (!textToTranslate || !textToTranslate.trim()) return;

        try {
            const translated = await translationService.translateText(textToTranslate, targetLang);

            const newMessage = {
                id: Date.now(),
                type: 'local', // from teacher
                original: textToTranslate,
                translated: translated,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, newMessage]);

            // Emit to socket
            if (socket && isConnected) {
                socket.emit('session_speech', {
                    roomId,
                    original: textToTranslate,
                    translated: translated,
                    language: 'en',
                    targetLanguage: targetLang
                });
            }

            // Clear buffer
            transcriptBuffer.current = '';
            setCurrentTranscript('');
        } catch (err) {
            console.error('Translation error:', err);
            toast.error(err.message || 'Translation failed');
        }
    };

    const handleToggleListening = () => {
        if (isListening) {
            translationService.stopListening();
            setIsListening(false);
            if (translationTimeout.current) {
                clearTimeout(translationTimeout.current);
            }
            processBuffer();
        } else {
            setIsListening(true);
            setCurrentTranscript('');
            transcriptBuffer.current = '';

            translationService.startListening(
                'en-US',
                async (result) => {
                    if (result.final && result.final.trim()) {
                        transcriptBuffer.current += (transcriptBuffer.current ? ' ' : '') + result.final;
                        if (translationTimeout.current) clearTimeout(translationTimeout.current);
                        translationTimeout.current = setTimeout(() => {
                            processBuffer();
                        }, 2500);
                    }
                    setCurrentTranscript(
                        transcriptBuffer.current +
                        (result.interim ? (transcriptBuffer.current ? ' ' : '') + result.interim : '')
                    );
                },
                (error) => {
                    console.error('Speech error:', error);
                    setIsListening(false);
                    toast.error('Microphone error');
                }
            );
        }
    };

    if (!student) {
        return (
            <div className="h-[calc(100vh-100px)] flex items-center justify-center p-6 animate-fade-in font-inter">
                {/* ... existing error UI ... */}
                <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneOff size={24} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Session Selected</h2>
                    <p className="text-slate-500 mb-6 text-sm">Please select a student from the list to start a session.</p>
                    <button onClick={() => navigate('/teacher/live-conversation')} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Back to Students
                    </button>
                </div>
            </div>
        );
    }

    // --- NORMALIZE STUDENT DATA ---
    const studentName = student?.firstName && student?.lastName
        ? `${student.firstName} ${student.lastName}`
        : student?.first_name && student?.last_name
            ? `${student.first_name} ${student.last_name}`
            : 'Student';

    const studentInitials = student?.firstName && student?.lastName
        ? `${student.firstName[0]}${student.lastName[0]}`
        : student?.first_name && student?.last_name
            ? `${student.first_name[0]}${student.last_name[0]}`
            : 'S';

    const studentImage = student?.profileImage || student?.profile_image;
    const studentGrade = student?.grade || 'Student';


    // WAITING SCREEN
    if (!isConnected) {
        return (
            <div className="flex flex-col h-[calc(87vh-60px)] items-center justify-center bg-slate-50/50 animate-fade-in font-inter">
                <div className="bg-white p-12 rounded-xl shadow-sm text-center max-w-xl w-full border border-slate-200 relative overflow-hidden transition-colors duration-200">

                    {/* Animated Icon */}
                    <div className="w-24 h-24 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 rounded-full border-2 border-primary-100 animate-ping opacity-20"></div>
                        <Radio size={40} className="text-primary-600 relative z-10" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                        {wasDeclined ? 'Request Declined' : 'Starting Live Conversation'}
                    </h2>

                    <p className={`mb-8 leading-relaxed max-w-lg mx-auto ${wasDeclined ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        {wasDeclined
                            ? `${student.first_name} declined the session request.`
                            : 'Waiting for student to join.'
                        }
                    </p>

                    <div className="flex items-center justify-center gap-5 bg-slate-50 p-6 rounded-xl mb-6 group transition-colors hover:bg-slate-100">
                        {/* Avatar */}
                        {studentImage ? (
                            <img
                                src={studentImage}
                                className="w-20 h-20 rounded-full object-cover shrink-0 shadow-sm border-2 border-white transition-all group-hover:scale-105 group-hover:border-primary-200"
                                alt={studentName}
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold shrink-0 shadow-sm bg-white text-slate-500 border-2 border-white relative transition-all group-hover:scale-105 group-hover:border-primary-200 group-hover:bg-white">
                                {studentInitials}
                            </div>
                        )}

                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900 leading-tight transition-colors group-hover:text-primary-700 mb-2">
                                {studentName}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                {studentGrade && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors">
                                        <GraduationCap size={10} />
                                        {studentGrade}
                                    </span>
                                )}

                                {student.language && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors">
                                        <Languages size={10} />
                                        {student.language}
                                    </span>
                                )}
                                {student.guardian_name && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors">
                                        <Heart size={10} />
                                        {student.guardian_name}
                                    </span>
                                )}
                                {student.phone && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors">
                                        <Phone size={10} />
                                        {student.phone}
                                    </span>
                                )}
                            </div>

                            <div>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm
                                    ${isStudentOnline
                                        ? 'bg-green-50 text-green-700 border-green-200/60'
                                        : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isStudentOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {isStudentOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {wasDeclined ? (
                        <div className="flex gap-4 justify-center mt-10">
                            <button
                                onClick={handleSendRequestAgain}
                            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                Send Request Again
                            </button>
                            <button
                                onClick={() => navigate('/teacher/live-conversation')}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                            >
                                Back to Students
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleEndCall}
                            className="w-full mt-10 mx-auto max-w-xs block py-2.5 bg-red-50 text-red-600 border border-red-100 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                        >
                            Cancel Request
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(87vh-60px)] bg-slate-50 animate-fade-in font-inter">

            {/* Page Title */}
            <div className="mb-4 pl-1">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Live Conversation</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Connected with <span className="font-semibold text-primary-600">{studentName}</span>
                </p>
            </div>

            {/* Header - Card Style */}
            <div className="mb-4 bg-white border border-slate-100 px-6 py-4 flex items-center justify-between rounded-xl shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-default">
                            <div className="w-12 h-12 rounded-full bg-primary-600 p-[2px] shadow-md group-hover:shadow-lg transition-all duration-500">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                    {studentImage ? (
                                        <img
                                            src={studentImage}
                                            alt={studentName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-base font-bold text-primary-700">
                                            {studentInitials}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-tight">
                                {studentName}
                            </h2>
                            {sessionEnded ? (
                                <p className="text-xs text-red-600 font-bold mt-0.5 bg-red-50 px-2 py-0.5 rounded-full inline-block">
                                    ● Live Connection Ended
                                </p>
                            ) : (
                                <p className="text-xs text-green-600 font-bold mt-0.5 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                    ● Live Connection
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {sessionEnded ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-bold text-sm text-red-600">Session Ended</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-mono font-medium text-slate-700">{duration}</span>
                        </div>
                    )}
                    <button
                        onClick={sessionEnded ? () => navigate('/teacher/live-conversation') : handleEndCall}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${sessionEnded
                            ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                            : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                            }`}
                        aria-label={sessionEnded ? 'Back to students' : 'End live conversation session'}
                    >
                        {sessionEnded ? 'Back to Students' : 'End Session'}
                    </button>
                </div>
            </div>

            {/* Split Screen Content */}
            <div className="flex-1 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

                {/* Left Card: Teacher / Local Speech */}
                <div className="bg-white rounded-xl border border-slate-100 flex flex-col relative overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                        <h3 className="text-sm font-bold text-slate-900">You (English)</h3>
                        <p className="text-xs text-slate-400">Your speech will appear here</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {messages.filter(m => m.type === 'local').map((msg) => (
                            <div key={msg.id} className="bg-primary-50 border border-primary-100 rounded-xl p-4 animate-fade-in text-right ml-auto max-w-[90%]">
                                <p className="text-base text-slate-800 font-medium">{msg.original}</p>
                                <p className="text-xs text-slate-500 mt-1">{msg.timestamp}</p>
                            </div>
                        ))}

                        {currentTranscript && (
                            <div className="bg-primary-100 border border-primary-200 rounded-xl p-4 animate-pulse">
                                <p className="text-base text-slate-700 italic">{currentTranscript}</p>
                                <p className="text-xs text-slate-500 mt-1">Listening...</p>
                            </div>
                        )}
                        <div ref={teacherEndRef} />
                    </div>

                    {messages.filter(m => m.type === 'local').length === 0 && !currentTranscript && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-slate-300">
                                <Mic size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Click microphone to start speaking</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 z-10">
                        <button
                            onClick={handleToggleListening}
                            disabled={sessionEnded}
                            className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${sessionEnded
                                ? 'bg-slate-300 cursor-not-allowed opacity-50'
                                : isListening
                                    ? 'bg-red-500'
                                    : 'bg-primary-600 hover:bg-primary-700'
                                }`}
                            aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                            aria-pressed={isListening}
                        >
                            {isListening ? (
                                <Mic size={24} className="text-white animate-pulse" />
                            ) : (
                                <Mic size={24} className="text-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Card: Student / Remote Speech */}
                <div className="bg-white rounded-xl border border-slate-100 flex flex-col relative overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                        <h3 className="text-sm font-bold text-slate-900">{studentName} ({targetLang})</h3>
                        <p className="text-xs text-slate-400">Translated to English</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {messages.filter(m => m.type === 'remote').map((msg) => (
                            <div key={msg.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-fade-in group relative hover:shadow-sm transition-shadow mr-auto max-w-[90%]">
                                <div className="pr-10">
                                    <p className="text-base text-slate-800 font-semibold">{msg.translated}</p>
                                    <p className="text-xs text-slate-500 text-left mt-1">{msg.timestamp}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!premiumTTS) { toast.error('Voice is not enabled for this school'); return; }
                                        try {
                                            await translationService.speakText(msg.translated, 'en-US', getVoiceMode('en', premiumTTS));
                                        } catch (err) {
                                            toast.error(err?.message || 'Could not play audio');
                                        }
                                    }}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-primary-600 hover:bg-primary-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    aria-label="Play translated audio"
                                >
                                    <Volume2 size={16} />
                                </button>
                            </div>
                        ))}
                        <div ref={studentEndRef} />
                    </div>

                    {messages.filter(m => m.type === 'remote').length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-300 absolute inset-0 pointer-events-none">
                            <div className="text-center">
                                <Languages size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Translations will appear here</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default LiveConversationSession;
