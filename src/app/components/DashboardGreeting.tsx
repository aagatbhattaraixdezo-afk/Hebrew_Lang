import React from 'react';

interface DashboardGreetingProps {
  name: string;
}

export default function DashboardGreeting({ name }: DashboardGreetingProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-eyebrow text-accent-color">Welcome back, {name} 👋</p>
      <h1 className="text-hero text-ink">
        {"Let's hit today's goal"}
      </h1>
    </div>
  );
}
