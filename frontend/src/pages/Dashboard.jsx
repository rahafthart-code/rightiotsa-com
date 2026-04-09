import React from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout 
      speciesFilter="Camel" 
      title={t('yourCamels')} 
    />
  );
}
