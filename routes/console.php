<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run the scheduled scraper every minute to check if any sources need scraping
Schedule::command('scraper:scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
