import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase'; 
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SafeUrlPipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private supabaseService = inject(Supabase);
  private cdr = inject(ChangeDetectorRef);
  
  trips: any[] = [];
  activities: any[] = [];
  
  // ⚡ Changed: Initially 0 or fallback, will be replaced by the DB value live
  maxWalletLimit: number = 15000; 

  newActivityTitles: { [tripId: number]: string } = {};
  newActivityCosts: { [tripId: number]: number } = {};
  newActivityDays: { [tripId: number]: number } = {};
  newActivityTimes: { [tripId: number]: string } = {};
  newActivityLocations: { [tripId: number]: string } = {};

  previewUrl: string = '';
  previewError: boolean = false;

  async ngOnInit() {
    await this.refreshAllData();
  }

  async refreshAllData() {
    try {
      // 1. Fetch your dynamic target budget configuration from Supabase
      const settingsData = await (this.supabaseService as any).getSettings();
      if (settingsData && settingsData.max_wallet_limit) {
        this.maxWalletLimit = settingsData.max_wallet_limit;
      }

      // 2. Fetch both relational tables from Supabase
      const tripsData = await this.supabaseService.getTrips();
      this.trips = tripsData || [];
      
      const activitiesData = await (this.supabaseService as any).getActivities();
      this.activities = activitiesData || [];

      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  }

  // --- MODULE 1: CREATE TRIP ENGINE ---
  async onAddTrip(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newTrip = {
      destination: formData.get('destination') as string,
      start_date: formData.get('startDate') as string,
      end_date: formData.get('endDate') as string,
      total_budget: parseFloat(formData.get('budget') as string) || 0,
      image_url: formData.get('imageUrl') as string || null
    };

    try {
      await this.supabaseService.createTrip(newTrip);
      form.reset();
      this.previewUrl = '';
      this.previewError = false;
      await this.refreshAllData();
    } catch (error) {
      console.error('❌ Error saving new trip:', error);
    }
  }

  // --- MODULE 3: LIVE COST AGGREGATION ENGINE ---
  async onAddActivity(tripId: number) {
    const title = this.newActivityTitles[tripId];
    const cost = this.newActivityCosts[tripId] || 0;
    const dayNum = this.newActivityDays[tripId] || null;
    const timeVal = this.newActivityTimes[tripId] || null;
    const locName = this.newActivityLocations[tripId] || null;

    if (!title || title.trim() === '') return;

    try {
      await (this.supabaseService as any).createActivity({
        trip_id: tripId,
        title: title,
        cost: cost,
        day_number: dayNum,
        time: timeVal,
        location_name: locName
      });

      this.newActivityTitles[tripId] = '';
      this.newActivityCosts[tripId] = null as any;
      this.newActivityDays[tripId] = null as any;
      this.newActivityTimes[tripId] = '';
      this.newActivityLocations[tripId] = '';

      await this.refreshAllData();
    } catch (error) {
      console.error('❌ Error saving activity item:', error);
    }
  }

  // 📝 NEW: Database handler for when the user modifies their limit input box
  async onUpdateWalletLimit(newLimit: number) {
    if (!newLimit || newLimit <= 0) return;
    try {
      this.maxWalletLimit = newLimit;
      await (this.supabaseService as any).updateMaxWalletLimit(newLimit);
      // Optional: run calculate calculations to verify warning states refresh cleanly
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error updating target budget configuration:', error);
    }
  }

  getActivitiesForTrip(tripId: number): any[] {
    return this.activities
      .filter(act => act.trip_id === tripId)
      .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
  }

  getActualSpentForTrip(tripId: number): number {
    return this.getActivitiesForTrip(tripId).reduce((sum, act) => sum + (Number(act.cost) || 0), 0);
  }

  getBudgetPercentage(trip: any): number {
    if (!trip.total_budget || trip.total_budget === 0) return 0;
    const pct = (this.getActualSpentForTrip(trip.id) / trip.total_budget) * 100;
    return Math.round(pct);
  }

  isIndividualTripOverspent(trip: any): boolean {
    return this.getActualSpentForTrip(trip.id) > (trip.total_budget || 0);
  }

  // --- MODULE 2: MATHEMATICAL ANALYTICS SUMS ---
  calculateTotalBudget(): number {
    return this.trips.reduce((sum, trip) => sum + (trip.total_budget || 0), 0);
  }

  calculateAverageBudget(): number {
    if (this.trips.length === 0) return 0;
    return Math.round(this.calculateTotalBudget() / this.trips.length);
  }

  getMostExpensiveDestination(): string {
    if (!this.trips || this.trips.length === 0) return 'None yet';
    const peakTrip = this.trips.reduce((highest, current) => {
      return (current.total_budget > (highest.total_budget || 0)) ? current : highest;
    }, this.trips[0]);
    return peakTrip?.destination || 'None yet';
  }

  isOverspending(): boolean {
    return this.calculateTotalBudget() > this.maxWalletLimit;
  }

  async onDelete(id: number) {
    if (confirm("Are you sure you want to remove this map entry? 🧸")) {
      try {
        await this.supabaseService.deleteTrip(id);
        await this.refreshAllData();
      } catch (error) {
        console.error('❌ Error eliminating entry:', error);
      }
    }
  }
}