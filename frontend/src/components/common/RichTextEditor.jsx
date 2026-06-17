import React, { useRef, useEffect, useState } from 'react';
import {
    Bold, Italic, Underline, List, ListOrdered,
    Mic, MicOff, RotateCcw, RotateCw, AlignLeft, AlignCenter, AlignRight,
    Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const RichTextEditor = ({ value, onChange, onSend, isSending, placeholder = "Type a message...", lang = 'en-US' }) => {
    const editorRef = useRef(null);
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);

    // Sync external value with editor content (only if empty or specific reset needed)
    useEffect(() => {
        if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = lang; // Use dynamic language

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

                    // Trigger change
                    onChange(editorRef.current.innerHTML);
                    editorRef.current.scrollTop = editorRef.current.scrollHeight;
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied.');
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [onChange]);

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

    const execCommand = (command, val = null) => {
        // Ensure focus BEFORE executing command
        if (document.activeElement !== editorRef.current) {
            editorRef.current?.focus();
        }

        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
        setTimeout(checkFormats, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onSend) onSend();
        }
        checkFormats();
    };

    const ToolbarButton = ({ onClick, icon: Icon, title, active = false }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-lg transition-all duration-200 ${active
                ? 'bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100'
                : 'text-slate-500 hover:bg-white hover:text-primary-600 hover:shadow-sm'
                }`}
        >
            <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        </button>
    );

    const Separator = () => (
        <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>
    );

    return (
        <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white transition-all shadow-sm overflow-hidden group">

            {/* Editor Input Area (Top) */}
            <div className="flex-1 relative cursor-text min-h-[80px] bg-white" onClick={() => editorRef.current?.focus()}>
                <div
                    ref={editorRef}
                    contentEditable
                    className="w-full h-full p-4 outline-none text-sm leading-6 text-slate-700 font-normal prose prose-sm max-w-none 
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                    [&_p]:my-1 custom-scrollbar"
                    onInput={(e) => {
                        onChange(e.currentTarget.innerHTML);
                        checkFormats();
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={checkFormats}
                    onMouseUp={checkFormats}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    }}
                    style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}
                />
                {!value && !isListening && (
                    <div className="absolute top-4 left-4 text-slate-400 pointer-events-none text-sm select-none">
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Bottom Toolbar & Actions */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-50 bg-slate-50/50">

                {/* Left: Formatting Tools - Responsive */}
                <div className="flex items-center gap-1 flex-wrap">
                    <div className="hidden sm:flex items-center gap-0.5 bg-slate-100/50 p-0.5 rounded-lg border border-slate-100">
                        <ToolbarButton onClick={() => execCommand('undo')} icon={RotateCcw} title="Undo" />
                        <ToolbarButton onClick={() => execCommand('redo')} icon={RotateCw} title="Redo" />
                    </div>
                    <Separator />
                    <div className="flex items-center gap-0.5 bg-slate-100/50 p-0.5 rounded-lg border border-slate-100">
                        <ToolbarButton active={activeFormats.includes('bold')} onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
                        <ToolbarButton active={activeFormats.includes('italic')} onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
                        <ToolbarButton active={activeFormats.includes('underline')} onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
                    </div>
                    <Separator />
                    <div className="hidden md:flex items-center gap-0.5 bg-slate-100/50 p-0.5 rounded-lg border border-slate-100">
                        <ToolbarButton active={activeFormats.includes('justifyLeft')} onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
                        <ToolbarButton active={activeFormats.includes('justifyCenter')} onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
                        <ToolbarButton active={activeFormats.includes('justifyRight')} onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
                    </div>
                    <Separator />
                    <div className="flex items-center gap-0.5 bg-slate-100/50 p-0.5 rounded-lg border border-slate-100">
                        <ToolbarButton active={activeFormats.includes('insertUnorderedList')} onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
                        <ToolbarButton active={activeFormats.includes('insertOrderedList')} onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
                    </div>
                </div>

                {/* Right: Actions (Voice & Send) */}
                <div className="flex items-center gap-3">

                    {/* Voice Input */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-full transition-all duration-300 ${isListening
                            ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-200'
                            : 'hover:bg-slate-200 text-slate-500 hover:text-primary-600'
                            }`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    {/* Send Button */}
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={!value || isSending}
                        className={`
                            inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300
                            ${!value || isSending
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0'}
                        `}
                        title="Send Message"
                    >
                        <Send size={18} className={isSending ? 'animate-pulse' : ''} ml={isSending ? 0 : 0.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
