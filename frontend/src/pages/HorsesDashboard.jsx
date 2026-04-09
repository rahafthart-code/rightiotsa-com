import React from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/DashboardLayout";

export default function HorsesDashboard() {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout 
      speciesFilter="Horse" 
      title={t('yourHorses')} 
    />
  );
}
