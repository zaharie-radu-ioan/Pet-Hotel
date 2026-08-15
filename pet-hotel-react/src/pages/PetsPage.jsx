import React from "react";
import AppHeader from "../components/AppHeader";

export default function PetsPage() {
  return (
    <div className="dashboard">
      <AppHeader />

      <main className="dashboard-body">
        <h1>Customize your pet</h1>

        <p className="muted-text">
          Selecteaza animalul pe care vrei sa il personalizezi.
        </p>

        <div className="hub-grid">
          <div className="hub-card">
            <h2>Animalele mele</h2>

            <p>
              Aici vor fi afisate animalele asociate contului tau.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}