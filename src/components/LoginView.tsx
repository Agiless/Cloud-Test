"use client";

import { useState } from "react";

interface LoginViewProps {
    onLogin: (name: string, batchNumber: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
    const [name, setName] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [errors, setErrors] = useState<{ name?: string; batch?: string }>({});

    const validate = () => {
        const e: { name?: string; batch?: string } = {};
        if (!name.trim()) e.name = "Name is required";
        if (!/^\d{6}$/.test(batchNumber)) e.batch = "Enter a valid 6-digit batch number";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (validate()) onLogin(name.trim(), batchNumber.trim());
    };

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1>📝 Class Test</h1>
                <p className="subtitle">Upload your answers to get started</p>

                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                    />
                    {errors.name && <p className="error-text">{errors.name}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="batch">Batch Number</label>
                    <input
                        id="batch"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value.replace(/\D/g, ""))}
                        autoComplete="off"
                    />
                    {errors.batch && <p className="error-text">{errors.batch}</p>}
                </div>

                <button type="submit" className="btn-primary">
                    Start Test →
                </button>
            </form>
        </div>
    );
}
