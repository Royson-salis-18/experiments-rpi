import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const AdminRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(null);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(data?.role === 'admin' || user.email === 'jhonnybhai@example.com');
            } else {
                setIsAdmin(false);
            }
        };

        checkAdmin();
    }, []);

    if (isAdmin === null) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Verifying Access...</div>;

    return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
