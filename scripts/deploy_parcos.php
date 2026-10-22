<?php
$app = App\Models\Application::find(6);
if (!$app) {
    echo "Application 6 not found\n";
    exit(1);
}
$uuid = (string) Illuminate\Support\Str::uuid();
queue_application_deployment(
    application: $app,
    deployment_uuid: $uuid,
    force_rebuild: true
);
echo "SUCCESS_DEPLOY_QUEUED: " . $uuid . "\n";
exit(0);
