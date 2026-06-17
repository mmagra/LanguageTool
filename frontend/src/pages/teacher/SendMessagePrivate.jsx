import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle, Check,
    User, Mail, Phone, GraduationCap, Users, Shield, Languages,
    ArrowLeft, Mic, MicOff, Send, Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, List, ListOrdered, RotateCcw, RotateCw
} from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RichTextEditor from '../../components/common/RichTextEditor';
// RichTextEditor is no longer used, but keeping it commented out for reference if needed
// import RichTextEditor from '../../components/common/RichTextEditor';

const SendMessagePrivate = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const student = location.state?.student;
    const [sentSuccess, setSentSuccess] = useState(false);
    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const editorRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let newTranscript = '';
                const startIndex = event.resultIndex !== undefined ? event.resultIndex : event.results.length - 1;

                for (let i = startIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newTranscript += event.results[i][0].transcript;
                    }
                }

                if (newTranscript && editorRef.current) {
                    const currentHtml = editorRef.current.innerHTML;
                    const separator = currentHtml && !currentHtml.endsWith('&nbsp;') && !currentHtml.endsWith(' ') ? ' ' : '';
                    editorRef.current.innerHTML = currentHtml + separator + newTranscript;
                    formik.setFieldValue('message', editorRef.current.innerHTML);
                    editorRef.current.scrollTop = editorRef.current.scrollHeight;
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied. Please allow permission.');
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        // Stop recognition if the user navigates away while listening
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.onerror = null;
                    recognitionRef.current.abort();
                } catch (_) { /* already stopped */ }
                recognitionRef.current = null;
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Voice input is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                toast.success('Listening...');
            } catch (err) {
                console.error(err);
                setIsListening(false);
            }
        }
    };

    // Toolbar Active State
    const [activeFormats, setActiveFormats] = useState([]);

    const checkFormats = () => {
        if (!editorRef.current) return;

        const formats = [
            'bold', 'italic', 'underline',
            'justifyCenter', 'justifyRight',
            'insertUnorderedList', 'insertOrderedList'
        ];

        let active = formats.filter(format => document.queryCommandState(format));

        // "Professional" behavior: Left align is active by default if others aren't
        if (!active.includes('justifyCenter') && !active.includes('justifyRight')) {
            active.push('justifyLeft');
        }

        setActiveFormats(active);
    };

    const execCommand = (command, value = null) => {
        // Ensure focus BEFORE executing command so it applies to the editor
        if (document.activeElement !== editorRef.current) {
            editorRef.current?.focus();
        }

        document.execCommand(command, false, value);
        if (editorRef.current) {
            formik.setFieldValue('message', editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
        setTimeout(checkFormats, 0);
    };

    const ToolbarButton = ({ onClick, icon: Icon, title, isActive }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${isActive
                ? 'bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-primary-600'
                }`}
        >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </button>
    );

    const Separator = () => (
        <div className="w-px h-5 bg-slate-200 mx-1.5 self-center"></div>
    );

    const formik = useFormik({
        initialValues: {
            message: '',
        },
        validationSchema: Yup.object({
            message: Yup.string()
                .required('Message content is required')
                // Reject markup with no actual text (e.g. "<div></div>", "&nbsp;")
                .test('has-text', 'Message content is required', (val) => {
                    if (!val) return false;
                    const text = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                    return text.length > 0;
                }),
        }),
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            if (!user) {
                toast.error('You must be logged in to send messages.');
                return;
            }
            if (!student) {
                toast.error('No recipient selected.');
                return;
            }

            try {
                // 1. Find or Create Conversation
                let conversationId = null;

                // Fetch existing conversations
                const conversationsRes = await api.get('/messages/conversations');
                const conversations = Array.isArray(conversationsRes.data)
                    ? conversationsRes.data
                    : (conversationsRes.data?.data || []);

                // Check if a conversation with this student already exists
                const existingConv = conversations.find(
                    c => c.student_id == student?.id
                );

                if (existingConv) {
                    conversationId = existingConv.id;
                } else {
                    if (!student) return; // Should not happen if validation passes, but good safety
                    // Create new conversation
                    const createRes = await api.post('/messages/conversations', {
                        studentId: student.id,
                        teacherId: user.id,
                        subject: 'Private Message'
                    });
                    conversationId = createRes.data?.id || createRes.data?.data?.id || createRes.id;
                }

                // 2. Send Message
                await api.post(`/messages/conversations/${conversationId}/messages`, {
                    content: values.message,
                    translatedContent: null
                });

                setSentSuccess(true);
                toast.success(`Message sent to ${student?.first_name}`);
                resetForm();
                if (editorRef.current) {
                    editorRef.current.innerHTML = ''; // Clear contentEditable
                }
                setActiveFormats([]); // Clear active formats
                setTimeout(() => setSentSuccess(false), 3000);

            } catch (error) {
                console.error('Send message error:', error);
                toast.error(error.message || 'Failed to send message.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Redirect if no student data
    if (!student) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-8 text-center animate-fade-in">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-slate-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 text-yellow-600 mb-6 ring-4 ring-yellow-50/50">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Student Selected</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">Please select a student from your main list to start a private conversation.</p>
                    <button
                        onClick={() => navigate('/teacher/students')}
                        className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Return to My Students
                    </button>
                </div>
            </div>
        );
    }

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-slate-900 font-medium break-all">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in font-inter h-full">

            {/* Main Header */}
            <div className="mb-6 pl-1">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Send a Private Message</h1>
                <p className="text-slate-500 text-sm mt-1">Secure confidential communication</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                {/* Left Column: Recipient Details Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-full flex flex-col relative overflow-hidden">
                        {/* decorative background element */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-50/50 to-transparent"></div>

                        <div className="flex flex-col items-center text-center mb-8 relative">
                            <div className="relative mb-4 group">
                                <div className="w-24 h-24 rounded-full bg-primary-600 p-[3px] shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-500">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                        {student.profile_image ? (
                                            <img
                                                src={student.profile_image}
                                                alt={`${student.first_name} ${student.last_name}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-slate-50 opacity-50"></div>
                                                <span className="text-2xl font-semibold text-primary-700 relative z-10">
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {student.is_online && (
                                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-sm" title="Online"></span>
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-1">{student.first_name} {student.last_name}</h2>
                            <p className="text-xs font-semibold tracking-wide text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100/50 uppercase">
                                ID: {student.student_id}
                            </p>
                        </div>

                        <div className="space-y-4 flex-1 relative z-10">
                            <DetailItem icon={Shield} label="Guardian" value={student.guardian_name} />
                            <DetailItem icon={GraduationCap} label="Grade" value={student.grade} />
                            <DetailItem icon={Languages} label="Language" value={student.language || student.preferred_language} />
                            <DetailItem icon={Mail} label="Email" value={student.email} />
                            <DetailItem icon={Phone} label="Phone" value={student.phone} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Editor */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 backdrop-blur-sm overflow-hidden relative h-[650px] flex flex-col">
                        {sentSuccess ? (
                            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50 shadow-inner">
                                        <Check size={40} className="text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                                    <p className="text-slate-500">Your secure message has been delivered.</p>
                                </div>
                            </div>
                        ) : null}

                        <form onSubmit={formik.handleSubmit} className="flex flex-col h-full">
                            {/* Toolbar - Sticky Top */}
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-1 flex-wrap shrink-0">
                                <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <ToolbarButton onClick={() => execCommand('undo')} icon={RotateCcw} title="Undo" />
                                    <ToolbarButton onClick={() => execCommand('redo')} icon={RotateCw} title="Redo" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <ToolbarButton isActive={activeFormats.includes('bold')} onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
                                    <ToolbarButton isActive={activeFormats.includes('italic')} onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
                                    <ToolbarButton isActive={activeFormats.includes('underline')} onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <ToolbarButton isActive={activeFormats.includes('justifyLeft')} onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
                                    <ToolbarButton isActive={activeFormats.includes('justifyCenter')} onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
                                    <ToolbarButton isActive={activeFormats.includes('justifyRight')} onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <ToolbarButton isActive={activeFormats.includes('insertUnorderedList')} onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
                                    <ToolbarButton isActive={activeFormats.includes('insertOrderedList')} onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 bg-white relative cursor-text group overflow-hidden" onClick={() => editorRef.current?.focus()}>
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="w-full h-full p-8 outline-none text-base leading-relaxed text-slate-700 font-normal prose prose-indigo max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 overflow-y-auto custom-scrollbar"
                                    onInput={(e) => {
                                        formik.setFieldValue('message', e.currentTarget.innerHTML);
                                        checkFormats();
                                    }}
                                    onKeyUp={checkFormats}
                                    onMouseUp={checkFormats}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const text = e.clipboardData.getData('text/plain');
                                        document.execCommand('insertText', false, text);
                                    }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                />
                                {!formik.values.message && !isListening && (
                                    <div className="absolute top-8 left-8 text-slate-400 pointer-events-none text-base font-light tracking-wide">
                                        Type your secure message here...
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${isListening
                                        ? 'bg-red-50 text-red-600 ring-2 ring-red-100 animate-pulse'
                                        : 'bg-white text-slate-600 hover:text-primary-600 hover:bg-white border border-slate-200 hover:border-primary-100 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    <span>{isListening ? 'Stop Recording' : 'Voice Input'}</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                    className={`inline-flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm
                                    transition-all duration-300 shadow-lg shadow-primary-600/20 hover:shadow-md hover:shadow-primary-600/30 hover:-translate-y-0.5
                                    ${formik.isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                                >
                                    <span>{formik.isSubmitting ? 'Sending...' : 'Send Message'}</span>
                                    {!formik.isSubmitting && <Send size={18} className="ml-1" />}
                                </button>
                            </div>
                        </form>
                    </div>

                    {formik.touched.message && formik.errors.message && (
                        <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2 text-red-500 text-sm font-medium px-4 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={16} />
                            {formik.errors.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SendMessagePrivate;
