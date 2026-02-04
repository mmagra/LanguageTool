import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Languages, Loader2, Sparkles, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { translationService } from '../../services/translationService';
import { useSocket } from '../../context/SocketContext';
import { useSessionContext } from '../../context/SessionContext';

const InPersonCommunication = () => {
    // Context
    const { preferredLangCode, preferredLanguage, getLanguageCode, getSpeechLocale } = useLanguage();
    const { t, i18n } = useTranslation();
    const { socket } = useSocket();
    const location = useLocation();
    const { setIsSessionActive: setGlobalSessionActive, setSessionEnded: setGlobalSessionEnded } = useSessionContext();

    // Session State
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);

    // Remote Session State
    const [remoteSessionId, setRemoteSessionId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Timer State
    const [duration, setDuration] = useState('00:00');
    const [time, setTime] = useState(0);

    // Teacher Info State
    const [teacherInfo, setTeacherInfo] = useState(null);

    // Communication State
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentTranscript, setCurrentTranscript] = useState('');

    // helper to get localized language name
    const getLocalizedLanguageName = (langName) => {
        try {
            const langCode = getLanguageCode(langName);
            const currentLocale = i18n.language || 'en';
            const displayNames = new Intl.DisplayNames([currentLocale], { type: 'language' });
            return displayNames.of(langCode) || langName;
        } catch (error) {
            console.error("Error localizing language name:", error);
            return langName;
        }
    };

    // Get localized preferred language name
    const localizedPreferredLanguage = getLocalizedLanguageName(preferredLanguage);

    // Refs
    const inputEndRef = useRef(null);
    const outputEndRef = useRef(null);
    const transcriptBuffer = useRef('');
    const translationTimeout = useRef(null);
    const sessionEndedRef = useRef(false);

    // --- AUTO JOIN LOGIC (User accepted invite from Dashboard) ---
    useEffect(() => {
        if (location.state?.autoJoinRoomId && socket && !isConnected) {
            const { autoJoinRoomId, teacherName, teacherImage } = location.state;
            console.log(`🚀 Auto-joining session ${autoJoinRoomId} with ${teacherName}`);

            setTeacherInfo({ name: teacherName, image: teacherImage });

            // Reset state for new session
            setSessionEnded(false);
            sessionEndedRef.current = false;
            setGlobalSessionEnded(false);

            // Join Room
            socket.emit('session_accepted', { roomId: autoJoinRoomId });
            setRemoteSessionId(autoJoinRoomId);
            setIsConnected(true);
            setIsSessionActive(true);
            // setGlobalSessionActive(true); // Handled by top-level effect now

            // Clear state so we don't re-join on refresh
            window.history.replaceState({}, document.title);

            toast.success(`Connected to In-Person Session`);
        }
    }, [location.state, socket, isConnected]);

    // Manage Global Session State - Block Navigation & Cleanup
    const remoteSessionIdRef = useRef(null);

    // Keep ref updated
    useEffect(() => {
        remoteSessionIdRef.current = remoteSessionId;
    }, [remoteSessionId]);

    useEffect(() => {
        // Validation: Only block if connected
        if (isConnected || location.state?.autoJoinRoomId) {
            setGlobalSessionActive(true);
            setGlobalSessionEnded(false);
            console.log('🔒 Student Session started - Navigation blocking active');
        }

        return () => {
            // Cleanup ONLY on unmount (or if this specific effect is torn down, which we want to avoid for dependency changes)
            // But we need to be careful. If we pass empty deps [], variables inside are stale.
            // usage of Ref solves stale closure for ID.
            // But we need to ensure this cleanup DOES NOT run just because isConnected changed.

            // Wait, if I put [] here, it runs on Mount and Unmount.
            // Perfect.
        };
    }, [isConnected, location.state]); // This still re-runs if isConnected changes.

    // CORRECT APPROACH: Separate Mount/Unmount effect for cleanup
    useEffect(() => {
        return () => {
            console.log('🔓 Student Session component unmounting - Cleanup');
            setGlobalSessionActive(false);

            // Check Ref for ID
            if (remoteSessionIdRef.current) {
                console.log('🛑 Emitting end_session on cleanup');
                socket?.emit('end_session', remoteSessionIdRef.current);
            }
        };
    }, []); // Empty dependencies = Only Unmount

    // Logic to set Global State on Connect (separate from cleanup)
    useEffect(() => {
        if (isConnected || location.state?.autoJoinRoomId) {
            setGlobalSessionActive(true);
            setGlobalSessionEnded(false);
        }
    }, [isConnected, location.state]);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isSessionActive && !sessionEnded) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isSessionActive, sessionEnded]);

    // Format Time
    useEffect(() => {
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = (time % 60).toString().padStart(2, '0');
        setDuration(`${mins}:${secs}`);
    }, [time]);

    // Scroll to bottom
    useEffect(() => {
        inputEndRef.current?.scrollIntoView({ behavior: "smooth" });
        outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentTranscript]);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if (!socket) return;

        // Listen for Remote Speech (Teacher speaking English)
        const handleRemoteSpeech = (data) => {
            console.log("🎤 Remote speech received:", data);

            const newMessage = {
                id: Date.now(),
                type: 'remote', // from teacher
                original: data.original,
                translated: data.translated,
                timestamp: new Date().toLocaleTimeString()
            };

            setMessages(prev => [...prev, newMessage]);

            if (data.translated) {
                setTimeout(() => {
                    // Use the proper speech locale (e.g., 'es-ES') for the student's preferred language
                    const speechLocale = getSpeechLocale(preferredLangCode);
                    console.log(`🔊 Speaking remote text in locale: ${speechLocale}`);
                    translationService.speakText(data.translated, speechLocale);
                }, 300);
            }
        };

        const handleEnded = () => {
            if (sessionEndedRef.current) return;
            sessionEndedRef.current = true;

            setSessionEnded(true);
            setGlobalSessionEnded(true);

            // Stop listening if active
            if (isListening) {
                translationService.stopListening();
                setIsListening(false);
            }

            toast.success("The session has ended.", {
                duration: 4000
            });
        };

        socket.on('session_speech', handleRemoteSpeech);
        socket.on('session_ended', handleEnded);

        // Reply to Presence Checks
        const handlePresenceCheck = () => {
            // Only reply if we think we are connected or auto-joined
            if (location.state?.autoJoinRoomId || isSessionActive) {
                console.log('📡 Received presence check, sending Ack');
                const rid = location.state?.autoJoinRoomId || remoteSessionId;
                if (rid) socket.emit('session_presence_ack', { roomId: rid });
            }
        };
        socket.on('session_check_presence', handlePresenceCheck);

        return () => {
            socket.off('session_speech', handleRemoteSpeech);
            socket.off('session_ended', handleEnded);
            socket.off('session_check_presence', handlePresenceCheck);
            setGlobalSessionActive(false); // Reset global state on unmount
            setGlobalSessionEnded(false);  // Reset global ended state
        };
    }, [socket, preferredLangCode, t, isListening]);

    // Process Buffer: Translate accumulated text
    const processBuffer = async () => {
        const textToTranslate = transcriptBuffer.current;
        if (!textToTranslate || !textToTranslate.trim()) return;

        try {
            console.log('🔄 Student: Starting translation...');
            // Translate Native -> English
            const translated = await translationService.translateText(textToTranslate, 'en');

            const newMessage = {
                id: Date.now(),
                type: 'local', // from student
                original: textToTranslate, // Native
                translated: translated,    // English
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, newMessage]);

            if (isConnected && socket && remoteSessionId) {
                socket.emit('session_speech', {
                    roomId: remoteSessionId,
                    original: textToTranslate,
                    translated: translated,
                    language: preferredLangCode, // e.g. 'es'
                    targetLanguage: 'en'
                });
            } else {
                // Fallback if somehow disconnected but active
                setTimeout(() => {
                    translationService.speakText(translated, 'en-US');
                }, 300);
            }

            // Clear buffer
            transcriptBuffer.current = '';
            setCurrentTranscript('');
        } catch (err) {
            console.error('Translation error:', err);
            toast.error(t('inPerson:translationFailed'));
        }
    };

    const handleToggleListening = () => {
        if (!isSessionActive) return;

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

            const speechLocale = getSpeechLocale(preferredLangCode);
            console.log(`🎤 Starting speech recognition with locale: ${speechLocale}`);

            translationService.startListening(
                speechLocale,
                async (result) => {
                    if (result.final && result.final.trim()) {
                        transcriptBuffer.current += (transcriptBuffer.current ? ' ' : '') + result.final;
                        if (translationTimeout.current) {
                            clearTimeout(translationTimeout.current);
                        }
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
                    toast.error(t('inPerson:micError'));
                }
            );
        }
    };

    // --- RENDER WAITING ROOM (INACTIVE) ---
    if (!isSessionActive) {
        return (
            <div className="flex flex-col h-[calc(82vh-60px)] items-center justify-center bg-gray-50/50 animate-fade-in font-inter">
                <div className="bg-white p-12 rounded-2xl shadow-xl shadow-gray-200/50 text-center max-w-xl w-full border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">

                    {/* Animated Icon */}
                    <div className="w-24 h-24 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 rounded-full border-2 border-primary-100 animate-ping opacity-20"></div>
                        <Radio size={40} className="text-primary-600 relative z-10" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        {t('inPerson:waitingTitle', 'Waiting for Teacher')}
                    </h2>

                    <p className="text-gray-500 mb-8 leading-relaxed max-w-lg mx-auto">
                        {t('inPerson:waitingDesc', 'Please wait here. Your In-Person Session will start automatically when your teacher connects.')}
                    </p>

                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl mb-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-gray-600">{t('inPerson:statusLabel')} <span className="text-green-600">{t('inPerson:onlineReady')}</span></span>
                    </div>

                </div>
            </div>
        );
    }

    // --- RENDER ACTIVE SESSION ---
    return (
        <div className="flex flex-col h-[calc(82vh-60px)] bg-gray-50 animate-fade-in font-inter relative">

            {/* Page Title */}
            <div className="mb-4 pl-1">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t('inPerson:title', 'In-Person Session')}</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {t('inPerson:connectedWith')} <span className="font-semibold text-primary-600">{teacherInfo?.name || t('inPerson:teacherDefault')}</span>
                </p>
            </div>

            {/* Header - Card Style (Matching Teacher View) */}
            <div className="mb-4 bg-white border border-gray-100 px-6 py-4 flex items-center justify-between rounded-2xl shrink-0 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-default">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[2px] shadow-md group-hover:shadow-lg transition-all duration-500">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                    {teacherInfo?.image ? (
                                        <img
                                            src={teacherInfo.image}
                                            alt={teacherInfo?.name || t('inPerson:teacherDefault')}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (teacherInfo?.name?.[0]) ? (
                                        <div className="w-full h-full flex items-center justify-center text-base font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b]">
                                            {teacherInfo.name[0]}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-base font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b]">
                                            T
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">
                                {location.state?.teacherName || t('inPerson:teacherDefault')}
                            </h2>
                            {sessionEnded ? (
                                <p className="text-xs text-red-600 font-bold mt-0.5 bg-red-50 px-2 py-0.5 rounded-full inline-block">
                                    ● {t('inPerson:liveConnectionEnded')}
                                </p>
                            ) : (
                                <p className="text-xs text-green-600 font-bold mt-0.5 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                    ● {t('inPerson:liveConnection')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {sessionEnded ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-bold text-sm text-red-600">{t('inPerson:sessionEndedStatus')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-mono font-medium text-gray-700">{duration}</span>
                        </div>
                    )}
                    {/* Student usually doesn't end session, but we can keep it hidden or show it if requested. */}
                </div>
            </div>

            {/* Split Screen Content */}
            <div className="flex-1 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

                {/* Left Card: Student / Source (Input) */}
                <div className="bg-white rounded-2xl border border-gray-100 flex flex-col relative overflow-hidden shadow-xl shadow-gray-200/50 transition-all">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">{t('inPerson:yourMessage')}</h3>
                            <p className="text-xs text-gray-400">{t('inPerson:speakingIn')} <span className="font-semibold text-primary-600">{localizedPreferredLanguage}</span></p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {messages.filter(m => m.type === 'local' || !m.type).map((msg) => (
                            <div key={msg.id} className="bg-primary-50 border border-primary-100 rounded-xl p-4 animate-fade-in text-right ml-auto max-w-[90%]">
                                <p className="text-base text-gray-800 font-medium">{msg.original}</p>
                                <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                            </div>
                        ))}

                        {currentTranscript && (
                            <div className="bg-primary-100 border border-primary-200 rounded-xl p-4 animate-pulse">
                                <p className="text-base text-gray-700 italic">{currentTranscript}</p>
                                <p className="text-xs text-gray-500 mt-1">{t('inPerson:listening')}</p>
                            </div>
                        )}

                        {messages.length === 0 && !currentTranscript && (
                            <div className="h-full flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <Mic size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">{t('inPerson:clickMic')}</p>
                                </div>
                            </div>
                        )}
                        <div ref={inputEndRef} />
                    </div>

                    {/* Microphone Button - Bottom Right */}
                    <div className="absolute bottom-4 right-4 z-10">
                        <button
                            onClick={handleToggleListening}
                            disabled={sessionEnded}
                            className={`
                                 relative p-4 rounded-full transition-all duration-300 transform 
                                 ${sessionEnded
                                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                                    : isListening
                                        ? 'bg-red-500 hover:scale-105 active:scale-95'
                                        : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 active:scale-95'
                                }
                            `}
                        >
                            {isListening ? (
                                <>
                                    <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></span>
                                    <Mic size={24} className="text-white relative z-10 animate-pulse" />
                                </>
                            ) : (
                                <Mic size={24} className="text-white relative z-10" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Card: Teacher / Target (Output) */}
                <div className="bg-white rounded-2xl border border-gray-100 flex flex-col relative overflow-hidden shadow-xl shadow-gray-200/50 transition-all">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                        <h3 className="text-sm font-bold text-gray-900">{location.state?.teacherName || t('inPerson:teacherDefault')} ({t('inPerson:english')})</h3>
                        <p className="text-xs text-gray-400">{t('inPerson:translatedTo')} {localizedPreferredLanguage}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {messages.filter(m => m.type === 'remote').map((msg) => (
                            <div key={msg.id} className="bg-purple-50 border border-purple-100 rounded-xl p-4 animate-fade-in group relative hover:shadow-sm transition-shadow mr-auto max-w-[90%]">
                                <div className="pr-10">
                                    <p className="text-base text-gray-800 font-semibold">{msg.translated}</p>
                                    <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                                </div>
                                <button
                                    onClick={() => translationService.speakText(msg.translated, 'en-US')}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-purple-600 hover:bg-purple-100 transition-all opacity-0 group-hover:opacity-100"
                                    title="Replay Audio"
                                >
                                    <Volume2 size={16} />
                                </button>
                            </div>
                        ))}

                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <Languages size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">{t('inPerson:noTranslations')}</p>
                                </div>
                            </div>
                        )}
                        <div ref={outputEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InPersonCommunication;
