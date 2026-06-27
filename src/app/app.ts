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

  // Activities per trip: key = trip.id, value = activity array
  activitiesMap: { [tripId: number]: any[] } = {};

  // Budget wallet limit (from settings table)
  maxWalletLimit: number = 15000;

  // Per-trip new activity form fields
  newActivityTitles: { [tripId: number]: string } = {};
  newActivityCosts: { [tripId: number]: number } = {};
  newActivityDays: { [tripId: number]: number } = {};
  newActivityTimes: { [tripId: number]: string } = {};
  newActivityLocations: { [tripId: number]: string } = {};

  // Image URL preview state
  previewUrl: string = '';
  previewError: boolean = false;

  async ngOnInit() {
    await this.refreshAllData();
  }

  async refreshAllData() {
    try {
      // 1. Load wallet limit from settings
      const settingsData = await this.supabaseService.getSettings();
      if (settingsData && settingsData.max_wallet_limit) {
        this.maxWalletLimit = settingsData.max_wallet_limit;
      }

      // 2. Fetch trips then load activities for each in parallel
      const tripsData = await this.supabaseService.getTrips();
      this.trips = tripsData || [];
      await this.fetchAllActivities();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  }

  // --- ACTIVITY FETCH HELPERS ---

  async fetchAllActivities() {
    const results = await Promise.all(
      this.trips.map(trip => this.supabaseService.getActivities(trip.id))
    );
    this.trips.forEach((trip, i) => {
      this.activitiesMap[trip.id] = results[i] || [];
    });
  }

  async fetchActivitiesForTrip(tripId: number) {
    try {
      const data = await this.supabaseService.getActivities(tripId);
      this.activitiesMap[tripId] = data || [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
    }
  }

  getActivitiesForTrip(tripId: number): any[] {
    return (this.activitiesMap[tripId] || [])
      .slice()
      .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
  }

  // --- MODULE 1: CREATE TRIP ---

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

  // --- MODULE 2: DELETE TRIP ---

  async onDelete(id: number) {
    if (confirm('Are you sure you want to remove this map entry? 🧸')) {
      try {
        await this.supabaseService.deleteTrip(id);
        delete this.activitiesMap[id];
        await this.refreshAllData();
      } catch (error) {
        console.error('❌ Error eliminating entry:', error);
      }
    }
  }

  // --- MODULE 3: TRIP STATUS TOGGLE (Dreaming / Visited) ---

  async onToggleTripStatus(trip: any) {
    const newVisited = !trip.visited;
    trip.visited = newVisited; // Optimistic update for instant UI feedback
    this.cdr.detectChanges();
    try {
      await this.supabaseService.updateTripStatus(trip.id, newVisited);
    } catch (error) {
      // Rollback on failure
      trip.visited = !newVisited;
      this.cdr.detectChanges();
      console.error('❌ Error updating trip status:', error);
    }
  }

  // --- MODULE 4: ACTIVITY MANAGEMENT ---

  async onAddActivity(tripId: number) {
    const title = this.newActivityTitles[tripId];
    if (!title || title.trim() === '') return;

    const cost = this.newActivityCosts[tripId] || null;
    const dayNum = this.newActivityDays[tripId] || null;
    const timeVal = this.newActivityTimes[tripId] || null;
    const locName = this.newActivityLocations[tripId] || null;

    try {
      await this.supabaseService.createActivity({
        trip_id: tripId,
        title: title.trim(),
        cost,
        day_number: dayNum,
        time: timeVal,
        location_name: locName
      });

      // Clear the form fields for this trip
      this.newActivityTitles[tripId] = '';
      this.newActivityCosts[tripId] = null as any;
      this.newActivityDays[tripId] = null as any;
      this.newActivityTimes[tripId] = '';
      this.newActivityLocations[tripId] = '';

      await this.fetchActivitiesForTrip(tripId);
    } catch (error) {
      console.error('❌ Error saving activity item:', error);
    }
  }

  async onDeleteActivity(activityId: number, tripId: number) {
    try {
      await this.supabaseService.deleteActivity(activityId);
      await this.fetchActivitiesForTrip(tripId);
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
    }
  }

  // --- MODULE 5: BUDGET ANALYTICS ---

  calculateTotalBudget(): number {
    return this.trips.reduce((sum, trip) => sum + (trip.total_budget || 0), 0);
  }

  calculateAverageBudget(): number {
    if (this.trips.length === 0) return 0;
    return Math.round(this.calculateTotalBudget() / this.trips.length);
  }

  getMostExpensiveDestination(): string {
    if (!this.trips || this.trips.length === 0) return 'None yet';
    const peakTrip = this.trips.reduce((highest, current) =>
      (current.total_budget > (highest.total_budget || 0)) ? current : highest
    , this.trips[0]);
    return peakTrip?.destination || 'None yet';
  }

  isOverspending(): boolean {
    return this.calculateTotalBudget() > this.maxWalletLimit;
  }

  getActualSpentForTrip(tripId: number): number {
    return this.getActivitiesForTrip(tripId).reduce((sum, act) => sum + (Number(act.cost) || 0), 0);
  }

  getBudgetPercentage(trip: any): number {
    if (!trip.total_budget || trip.total_budget === 0) return 0;
    return Math.round((this.getActualSpentForTrip(trip.id) / trip.total_budget) * 100);
  }

  isIndividualTripOverspent(trip: any): boolean {
    return this.getActualSpentForTrip(trip.id) > (trip.total_budget || 0);
  }

  // --- MODULE 6: WALLET LIMIT SETTING ---

  async onUpdateWalletLimit(newLimit: number) {
    if (!newLimit || newLimit <= 0) return;
    try {
      this.maxWalletLimit = newLimit;
      await this.supabaseService.updateMaxWalletLimit(newLimit);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error updating target budget configuration:', error);
    }
  }
}