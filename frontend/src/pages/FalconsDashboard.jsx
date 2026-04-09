import React from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/DashboardLayout";

export default function FalconsDashboard() {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout 
      speciesFilter="Falcon" 
      title={t('yourFalcons')} 
    />
  );
}
