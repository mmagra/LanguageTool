import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBlockModal from '../components/common/NavigationBlockModal';

const SessionContext = createContext();

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (!context) {
        return {
            isSessionActive: false,
            sessionEnded: false,
            setIsSessionActive: () => { },
            setSessionEnded: () => { },
            canNavigate: () => true,
            requestNavigation: () => true
        };
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);
    const navigate = useNavigate();

    const canNavigate = () => {
        return !isSessionActive || sessionEnded;
    };

    const requestNavigation = (path) => {
        if (canNavigate()) {
            // Navigation allowed
            navigate(path);
            return true;
        } else {
            // Show confirmation modal
            setPendingPath(path);
            setShowModal(true);
            return false;
        }
    };

    const handleConfirmNavigation = () => {
        if (pendingPath) {
            // Force navigation and reset session state
            setIsSessionActive(false);
            setSessionEnded(true);
            navigate(pendingPath);
        }
        setShowModal(false);
        setPendingPath(null);
    };

    const handleCancelNavigation = () => {
        setShowModal(false);
        setPendingPath(null);
    };

    const value = {
        isSessionActive,
        sessionEnded,
        setIsSessionActive,
        setSessionEnded,
        canNavigate,
        requestNavigation
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
            <NavigationBlockModal
                isOpen={showModal}
                onCancel={handleCancelNavigation}
                onConfirm={handleConfirmNavigation}
                message="You have an active live conversation. Leaving this page will end it. Are you sure?"
            />
        </SessionContext.Provider>
    );
};
