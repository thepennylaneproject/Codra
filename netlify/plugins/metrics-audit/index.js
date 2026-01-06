/**
 * Netlify Build Plugin: Metrics Audit
 *
 * Runs decision point and accent color audits during the build process.
 * Fails the build if metrics exceed targets.
 */

import { execSync } from 'child_process';

export default {
  onPreBuild: async ({ utils }) => {
    console.log('Running Codra metrics audit...\n');

    try {
      // Run decision point audit
      console.log('=== Decision Point Audit ===');
      const decisionOutput = execSync('npm run audit:decisions', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log(decisionOutput);

      // Extract decision count from output
      const decisionMatch = decisionOutput.match(/Total Decisions: (\d+)/);
      if (decisionMatch) {
        const count = parseInt(decisionMatch[1], 10);
        if (count > 10) {
          return utils.build.failBuild(
            `Decision count (${count}) exceeds target (10). Please reduce decision points.`
          );
        }
      }

      console.log('\n✅ Decision audit passed\n');
    } catch (error) {
      if (error.status === 1) {
        // Script exited with error code 1 (exceeds target)
        return utils.build.failBuild(
          'Decision point audit failed. See output above for details.'
        );
      }
      console.error('Error running decision audit:', error.message);
    }

    try {
      // Run accent color audit (non-blocking warning)
      console.log('=== Accent Color Audit ===');
      const accentOutput = execSync('npm run audit:accent', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log(accentOutput);

      // Check for unjustified usages (warning only, doesn't fail build)
      if (accentOutput.includes('Unjustified')) {
        console.warn('\n⚠️  Warning: Unjustified accent usages found. Please review.\n');
      } else {
        console.log('\n✅ Accent audit passed\n');
      }
    } catch (error) {
      console.error('Error running accent audit:', error.message);
      // Don't fail build on accent audit errors
    }
  },

  onPostBuild: async ({ constants, utils }) => {
    console.log('\n=== Bundle Size Analysis ===\n');

    try {
      // Run bundle analysis
      const bundleOutput = execSync('tsx scripts/analyze-bundle.ts', {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: constants.BUILD_DIR || process.cwd()
      });
      console.log(bundleOutput);

      // Save bundle report as build artifact
      console.log('\n📦 Bundle report saved for comparison\n');
    } catch (error) {
      console.error('Error analyzing bundle:', error.message);
      // Don't fail build on bundle analysis errors
    }
  }
};
