import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Check, User, Mail, Phone, GraduationCap, Users, Shield, Languages,
    ArrowLeft, Mic, MicOff, Send, Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, List, ListOrdered, RotateCcw, RotateCw, Filter,
    CheckSquare, Square, AlertCircle, ChevronDown
} from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const GroupMessage = () => {
    const { user } = useAuth();

    // Student List State
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);

    // Editor State
    const [sentSuccess, setSentSuccess] = useState(false);
    const [sentCount, setSentCount] = useState(0); // Store count for success message
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const editorRef = useRef(null);

    // Fetch Students & Grades
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentsRes, gradesRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/grades')
                ]);

                const studentsData = (Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.data || []))
                    .filter(student => ['active', 'approved'].includes(student.status))
                    .sort((a, b) => b.id - a.id); // Ensure descending order
                setStudents(studentsData);
                setGrades(gradesRes.data || []);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Students
    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        // Only show students if at least one grade is selected
        if (selectedGrades.length === 0) return false;

        const matchesSearch = (
            student.first_name?.toLowerCase().includes(term) ||
            student.last_name?.toLowerCase().includes(term) ||
            student.email?.toLowerCase().includes(term) ||
            student.student_id?.toLowerCase().includes(term)
        );

        const matchesGrade = selectedGrades.includes('All Grades') || selectedGrades.includes(student.grade_name);

        return matchesSearch && matchesGrade;
    });

    // Handle Selection
    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
        setSelectAll(!selectAll);
    };

    const toggleStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
            setSelectAll(false);
        } else {
            setSelectedStudents(prev => [...prev, id]);
        }
    };

    const toggleGrade = (gradeName) => {
        if (gradeName === 'All Grades') {
            if (selectedGrades.includes('All Grades')) {
                setSelectedGrades([]);
            } else {
                setSelectedGrades(['All Grades', ...grades.map(g => g.name)]);
            }
        } else {
            setSelectedGrades(prev => {
                const newGrades = prev.includes(gradeName)
                    ? prev.filter(g => g !== gradeName)
                    : [...prev, gradeName];

                // If we deselected a grade and "All Grades" was on, remove it
                if (prev.includes('All Grades') && prev.includes(gradeName)) {
                    return newGrades.filter(g => g !== 'All Grades');
                }

                // If we selected all individual grades, add "All Grades" logic if desired, 
                // but let's keep it simple: manual "All Grades" toggle handles bulk.
                return newGrades;
            });
        }
    };

    // --- Editor Logic ---
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
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied.');
                    setIsListening(false);
                }
            };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Voice input not supported.');
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

        if (editorRef.current) formik.setFieldValue('message', editorRef.current.innerHTML);
        // Keep focus (redundant but safe)
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
                : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600'
                }`}
        >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </button>
    );

    const Separator = () => <div className="w-px h-5 bg-gray-200 mx-1.5 self-center"></div>;

    const formik = useFormik({
        initialValues: { message: '' },
        validationSchema: Yup.object({
            message: Yup.string().required('Message content is required'),
        }),
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            if (selectedStudents.length === 0) {
                toast.error('Please select at least one student.');
                setSubmitting(false);
                return;
            }
            if (!user) {
                toast.error('You must be logged in.');
                return;
            }

            // Capture count before clearing
            const currentCount = selectedStudents.length;

            try {
                await api.post('/messages/group', {
                    studentIds: selectedStudents,
                    content: values.message
                });

                setSentCount(currentCount);
                setSentSuccess(true);
                toast.success(`Sent to ${currentCount} students!`);
                resetForm();
                if (editorRef.current) editorRef.current.innerHTML = '';
                setSelectedStudents([]);
                setSelectAll(false);
                setActiveFormats([]); // Clear formats on send
                setTimeout(() => setSentSuccess(false), 3000);

            } catch (error) {
                console.error('Group send error:', error);
                toast.error('Failed to send messages.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="animate-fade-in font-inter h-full">
            {/* Main Header */}
            <div className="mb-6 pl-1">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Send Group Message</h1>
                <p className="text-gray-500 text-sm mt-1">Broadcast updates to multiple students.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch h-[calc(100vh-220px)] min-h-[500px]">

                {/* Left Column: Selection Panel */}
                <div className="lg:col-span-1 flex flex-col">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden h-full relative">
                        {/* Panel Header */}
                        <div className="p-5 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Recipients</h2>
                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                                    {selectedStudents.length} Selected
                                </span>
                            </div>

                            {/* Grade Selector - Prominent */}
                            <div className="relative">
                                {/* Click outside overlay - ensures clicking anywhere else closes dropdown */}
                                {showGradeDropdown && (
                                    <div
                                        className="fixed inset-0 z-20 cursor-default"
                                        onClick={() => setShowGradeDropdown(false)}
                                    ></div>
                                )}

                                <button
                                    onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                                    className={`relative z-30 w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-300 group
                                        ${selectedGrades.length > 0
                                            ? 'bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-200 text-primary-900 shadow-sm'
                                            : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg transition-colors ${selectedGrades.length > 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Filter size={16} />
                                        </div>
                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Filter By</span>
                                            <span>{selectedGrades.length > 0 ? `${selectedGrades.length} Grade(s)` : 'Select Grade'}</span>
                                        </div>
                                    </div>

                                    <div className={`transition-transform duration-300 text-gray-400 group-hover:text-gray-600 ${showGradeDropdown ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>

                                {showGradeDropdown && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 z-30 p-2 animate-in fade-in slide-in-from-top-2 max-h-72 overflow-y-auto custom-scrollbar">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Available Grades</div>

                                        <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-all group">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedGrades.includes('All Grades') ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30' : 'border-gray-200 bg-white group-hover:border-primary-300'}`}>
                                                {selectedGrades.includes('All Grades') && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <input type="checkbox" className="hidden"
                                                checked={selectedGrades.includes('All Grades')}
                                                onChange={() => toggleGrade('All Grades')}
                                            />
                                            <span className={`text-sm font-medium transition-colors ${selectedGrades.includes('All Grades') ? 'text-primary-700' : 'text-gray-700'}`}>All Grades</span>
                                        </label>

                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                        {grades.map(grade => (
                                            <label key={grade.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-all group">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedGrades.includes(grade.name) ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30' : 'border-gray-200 bg-white group-hover:border-primary-300'}`}>
                                                    {selectedGrades.includes(grade.name) && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <input type="checkbox" className="hidden"
                                                    checked={selectedGrades.includes(grade.name)}
                                                    onChange={() => toggleGrade(grade.name)}
                                                />
                                                <span className={`text-sm font-medium transition-colors ${selectedGrades.includes(grade.name) ? 'text-primary-700' : 'text-gray-700'}`}>{grade.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search & Select All - Only show if grades selected */}
                            <div className={`transition-all duration-500 overflow-hidden ${selectedGrades.length > 0 ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search name/ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50/50 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={toggleSelectAll}
                                        className={`px-3 rounded-xl flex items-center gap-1.5 transition-all border ${selectAll ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                        title="Select All Visible"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectAll ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300'}`}>
                                            {selectAll && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">All</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar bg-slate-50/50">
                            {loading ? (
                                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div></div>
                            ) : selectedGrades.length === 0 ? (
                                /* Empty State - No Grade Selected */
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
                                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 ring-8 ring-gray-50">
                                        <Filter size={24} />
                                    </div>
                                    <h3 className="text-gray-900 font-bold mb-1">Select a Grade</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px]">
                                        Choose a grade filter above to view and select students.
                                    </p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center p-8 text-gray-500 text-sm">No students match your search.</div>
                            ) : (
                                filteredStudents.map(student => {
                                    // Logic adapted from AllStudents.jsx to ensure ID is available
                                    const displayId = student.username || student.student_id || `STU-2024-${student.id.toString().padStart(3, '0')}`;

                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudent(student.id)}
                                            className={`p-4 border-b cursor-pointer transition-all duration-200 flex gap-3 group relative overflow-hidden
                                            ${selectedStudents.includes(student.id)
                                                    ? 'bg-primary-50/60 border-primary-200' // Darker border for selected
                                                    : 'bg-white hover:bg-gray-50 border-gray-100'}`} // Match Conversations.jsx default
                                        >
                                            {selectedStudents.includes(student.id) && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full"></div>
                                            )}


                                            {student.profile_image ? (
                                                <img
                                                    src={student.profile_image}
                                                    alt={`${student.first_name} ${student.last_name}`}
                                                    className={`w-12 h-12 rounded-full object-cover shrink-0 shadow-sm transition-all group-hover:scale-105 ${selectedStudents.includes(student.id)
                                                        ? 'ring-2 ring-primary-100 border-2 border-primary-600'
                                                        : 'border border-gray-100 group-hover:border-primary-200'
                                                        }`}
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm transition-all group-hover:scale-105
                                                    ${selectedStudents.includes(student.id)
                                                        ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white ring-2 ring-primary-100'
                                                        : 'bg-white text-gray-500 border border-gray-100 group-hover:border-primary-200 group-hover:bg-white'}`}>
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                                        <span className={`font-bold text-sm truncate transition-colors ${selectedStudents.includes(student.id) ? 'text-primary-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                            {student.first_name} {student.last_name}
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${selectedStudents.includes(student.id) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {student.grade_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className={`text-xs truncate leading-relaxed ${selectedStudents.includes(student.id) ? 'text-primary-700/80 font-medium' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                                    ID: {displayId}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Editor */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 backdrop-blur-sm overflow-hidden relative h-full flex flex-col">
                        {sentSuccess && (
                            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50 shadow-inner">
                                        <Check size={40} className="text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-500">Delivered to {sentCount} students.</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={formik.handleSubmit} className="flex flex-col h-full">
                            {/* Toolbar */}
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-1 flex-wrap shrink-0">
                                <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    <ToolbarButton onClick={() => execCommand('undo')} icon={RotateCcw} title="Undo" />
                                    <ToolbarButton onClick={() => execCommand('redo')} icon={RotateCw} title="Redo" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    <ToolbarButton isActive={activeFormats.includes('bold')} onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
                                    <ToolbarButton isActive={activeFormats.includes('italic')} onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
                                    <ToolbarButton isActive={activeFormats.includes('underline')} onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    <ToolbarButton isActive={activeFormats.includes('justifyLeft')} onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
                                    <ToolbarButton isActive={activeFormats.includes('justifyCenter')} onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
                                    <ToolbarButton isActive={activeFormats.includes('justifyRight')} onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
                                </div>
                                <Separator />
                                <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    <ToolbarButton isActive={activeFormats.includes('insertUnorderedList')} onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
                                    <ToolbarButton isActive={activeFormats.includes('insertOrderedList')} onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
                                </div>
                            </div>

                            {/* Editor */}
                            <div className="flex-1 bg-white relative cursor-text group overflow-hidden" onClick={() => editorRef.current?.focus()}>
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="w-full h-full p-8 outline-none text-base leading-relaxed text-gray-700 font-normal prose prose-indigo max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 overflow-y-auto custom-scrollbar"
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
                                    <div className="absolute top-8 left-8 text-gray-400 pointer-events-none text-base font-light tracking-wide">
                                        Type a message to confirm...
                                        <br />
                                        <span className="text-sm opacity-60">Try "Dear Students..." or use the microphone.</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${isListening ? 'bg-red-50 text-red-600 ring-2 ring-red-100 animate-pulse' : 'bg-white text-gray-600 hover:text-primary-600 shadow-sm border border-gray-200'}`}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    <span>{isListening ? 'Stop' : 'Voice Input'}</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={formik.isSubmitting || selectedStudents.length === 0}
                                    className={`inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 ${formik.isSubmitting || selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                                >
                                    <span>{formik.isSubmitting ? 'Sending...' : `Send to ${selectedStudents.length} Students`}</span>
                                    {!formik.isSubmitting && <Send size={18} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupMessage;
