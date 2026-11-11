<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('billing:process-hourly')->hourly();