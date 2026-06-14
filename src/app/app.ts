import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private supabaseService = inject(Supabase);
  trips: any[] = [];

  // 1. Automatically pull items from cloud when app mounts
  async ngOnInit() {
    await this.fetchTrips();
  }

  async fetchTrips() {
    try {
      this.trips = await this.supabaseService.getTrips() || [];
    } catch (error) {
      console.error('❌ Error fetching trips:', error);
    }
  }

  // 2. Capture form fields and write them to Supabase
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
      form.reset(); // Clear form on success
      await this.fetchTrips(); // Refresh the grid list layout view
    } catch (error) {
      console.error('❌ Error saving new trip:', error);
      alert('Could not save your trip. Check your table parameters.');
    }
  }
}